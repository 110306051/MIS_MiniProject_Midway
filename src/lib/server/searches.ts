/**
 * 搜尋服務：建立搜尋（計算各地點原始數據）、讀取、投票、房源層級評分
 */
import { and, desc, eq, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { amenityScores, candidatePoints, listings, rentStats, searches, votes, workplacePresets } from "@/db/schema";
import { AMENITIES, DEFAULT_WEIGHTS, FLEX_OPTIONS, type RoomType } from "../constants";
import { inferLines } from "../estimate";
import { evaluate, listingTradeoffs, scoreOne } from "../scoring";
import type { AreaMetric, Commute, ListingView, Metrics, SearchInput, SearchRecord, VoteMap, Weights } from "../types";
import { getCommutes } from "./commute";

/* ---------- 輸入驗證 ---------- */

const workplaceSchema = z.object({
  label: z.string().min(1).max(120),
  lat: z.number().min(21).max(27),
  lng: z.number().min(118).max(123),
  placeId: z.string().max(300).optional(),
  presetId: z.string().max(60).optional(),
});
const personSchema = z.object({
  name: z.string().trim().min(1).max(12),
  workplace: workplaceSchema,
  mode: z.enum(["transit", "scooter", "car"]),
  days: z.number().int().min(1).max(7),
  max: z.number().int().min(10).max(180),
});
export const searchInputSchema = z.object({
  people: z.tuple([personSchema, personSchema]),
  room: z.enum(["studio", "2r", "3r"]),
  budget: z.number().int().min(3000).max(300000),
  splitA: z.number().int().min(0).max(100),
  prefs: z.array(z.enum(AMENITIES.map((a) => a.id) as [string, ...string[]])).max(AMENITIES.length),
});
const flexSchema = z.number().int().refine((v) => FLEX_OPTIONS.includes(v), "預算彈性只能是 0、1000、2000、3000");
const createSchema = searchInputSchema.extend({ budgetFlex: flexSchema.optional() });
export const weightsSchema = z.object({
  weights: z.object({ f: z.number().min(0).max(10), s: z.number().min(0).max(10), r: z.number().min(0).max(10), p: z.number().min(0).max(10) }),
  includeCost: z.boolean(),
  budgetFlex: flexSchema.optional(),
});

/* ---------- 工具 ---------- */

function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return [...bytes].map((b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
}

export async function listPresets() {
  return db.select().from(workplacePresets).orderBy(workplacePresets.city, workplacePresets.name);
}

/* ---------- 建立搜尋 ---------- */

export async function createSearch(raw: unknown, userId: string | null = null): Promise<string> {
  const { budgetFlex = 0, ...parsed } = createSchema.parse(raw);
  const input = parsed as SearchInput;

  const [points, rents, amens, presets, prices] = await Promise.all([
    db.select().from(candidatePoints).where(eq(candidatePoints.active, true)),
    db.select().from(rentStats).where(eq(rentStats.roomType, input.room)),
    db.select().from(amenityScores),
    db.select().from(workplacePresets),
    db
      .select({ pointId: listings.pointId, rent: listings.rent })
      .from(listings)
      .where(and(eq(listings.roomType, input.room), eq(listings.active, true))),
  ]);
  // 每區所有上架房源的租金，用來判斷「預算內找不找得到房子」
  const rentsByPoint = new Map<string, number[]>();
  for (const x of prices) rentsByPoint.set(x.pointId, [...(rentsByPoint.get(x.pointId) ?? []), x.rent]);

  // 補上工作地的軌道路線（常見工作地直接用；Google 地址由附近地點推估，估算模式使用）
  for (const p of input.people) {
    const preset = presets.find((x) => x.id === p.workplace.presetId);
    p.workplace.lines = preset ? preset.lines : inferLines(p.workplace, [...presets, ...points]);
  }

  const origins = points.map((p) => ({ key: `pt:${p.id}`, lat: p.lat, lng: p.lng, lines: p.lines }));
  const [cA, cB] = await Promise.all(input.people.map((person) => getCommutes(origins, person)));

  const areas: AreaMetric[] = points.map((p, i) => ({
    pointId: p.id,
    name: p.name,
    city: p.city,
    lat: p.lat,
    lng: p.lng,
    lines: p.lines,
    rent: rents.find((r) => r.pointId === p.id)?.median ?? 0,
    market: rents.find((r) => r.pointId === p.id)?.median ?? 0,
    rents: (rentsByPoint.get(p.id) ?? []).sort((a, b) => a - b),
    amen: AMENITIES.map((a) => amens.find((x) => x.pointId === p.id && x.category === a.id)?.score ?? 0),
    commute: [cA[i], cB[i]],
  }));
  const sources = new Set(areas.flatMap((a) => a.commute.map((c) => c.source)));
  const metrics: Metrics = {
    areas,
    commuteSource: sources.size > 1 ? "mixed" : ([...sources][0] ?? "estimate"),
    computedAt: new Date().toISOString(),
  };

  const id = newId();
  await db.insert(searches).values({ id, userId, input, weights: DEFAULT_WEIGHTS, includeCost: true, budgetFlex, metrics });
  return id;
}

/* ---------- 讀取／更新 ---------- */

export async function getSearch(id: string): Promise<SearchRecord | null> {
  const [row] = await db.select().from(searches).where(eq(searches.id, id));
  if (!row) return null;
  return {
    id: row.id,
    input: row.input as SearchInput,
    weights: row.weights as Weights,
    includeCost: row.includeCost,
    budgetFlex: row.budgetFlex,
    metrics: row.metrics as Metrics,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function updateWeights(id: string, raw: unknown) {
  const { weights, includeCost, budgetFlex } = weightsSchema.parse(raw);
  const res = await db.update(searches).set({ weights, includeCost, ...(budgetFlex !== undefined && { budgetFlex }), updatedAt: new Date() }).where(eq(searches.id, id)).returning({ id: searches.id });
  return res.length > 0;
}

export async function getVotes(id: string): Promise<VoteMap> {
  const rows = await db.select().from(votes).where(eq(votes.searchId, id));
  const map: VoteMap = {};
  for (const v of rows) {
    map[v.pointId] ??= [false, false];
    map[v.pointId][v.person] = v.liked;
  }
  return map;
}

export const voteSchema = z.object({ pointId: z.string().max(60), person: z.union([z.literal(0), z.literal(1)]), liked: z.boolean() });

export async function setVote(id: string, raw: unknown) {
  const { pointId, person, liked } = voteSchema.parse(raw);
  await db
    .insert(votes)
    .values({ searchId: id, pointId, person, liked })
    .onConflictDoUpdate({ target: [votes.searchId, votes.pointId, votes.person], set: { liked, updatedAt: new Date() } });
  return getVotes(id);
}

/* ---------- 第二階段：房源層級 ---------- */

export type ViewOpts = { weights: Weights; includeCost: boolean; budgetFlex: number };

type ListingRow = typeof listings.$inferSelect;

/** 把一筆房源轉成畫面用的資料：通勤、分數、價格狀態、取捨 */
function toView(l: ListingRow, area: AreaMetric, commute: [Commute, Commute], search: SearchRecord, o: ViewOpts): ListingView {
  const { input } = search;
  const amen = [...area.amen];
  const petIdx = AMENITIES.findIndex((a) => a.id === "pet");
  amen[petIdx] = l.features.includes("可養寵物") ? 1 : amen[petIdx] * 0.5;
  const s = scoreOne({ rent: l.rent, amen, commute }, input, o.weights, o.includeCost, Infinity);
  const overBy = Math.max(0, l.rent - input.budget);
  const { vsMarketPct, tradeoffs } = listingTradeoffs(l, area.market ?? area.rent, input.room as RoomType);
  return {
    id: l.id, pointId: l.pointId, areaName: area.name, title: l.title, address: l.address, lat: l.lat, lng: l.lng,
    rent: l.rent, ping: l.ping, floor: l.floor, walkMin: l.walkMin, age: l.age, elevator: l.elevator, features: l.features,
    commute, score: s.S,
    priceStatus: overBy === 0 ? "in" : overBy <= o.budgetFlex ? "near" : "over",
    overBy, vsMarketPct, tradeoffs,
    overCommute: commute[0].min > input.people[0].max || commute[1].min > input.people[1].max,
  };
}

/** 估算模式時，房源通勤 ≈ 區域通勤 + 到站步行時間的差異（區域以步行 6 分鐘為基準） */
const nearbyCommute = (c: Commute, walkMin: number): Commute => ({ ...c, min: Math.max(5, c.min + (walkMin - 6)) });

const rankListings = (a: ListingView, b: ListingView) => {
  const tier = (l: ListingView) => (l.overCommute ? 3 : l.priceStatus === "in" ? 0 : l.priceStatus === "near" ? 1 : 2);
  return tier(a) - tier(b) || b.score - a.score;
};

/** 單一區域內的所有房源（Google 模式時逐筆查詢真實通勤） */
export async function getAreaListings(search: SearchRecord, pointId: string, o: ViewOpts): Promise<ListingView[]> {
  const area = search.metrics.areas.find((a) => a.pointId === pointId);
  if (!area) return [];
  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.pointId, pointId), eq(listings.roomType, search.input.room), eq(listings.active, true)));

  const origins = rows.map((l) => ({ key: `ls:${l.id}`, lat: l.lat, lng: l.lng, lines: area.lines }));
  const [cA, cB] = await Promise.all(search.input.people.map((p) => getCommutes(origins, p)));

  return rows
    .map((l, i) => {
      const pick = (c: Commute, base: Commute) => (c.source === "google" ? c : nearbyCommute(base, l.walkMin));
      return toView(l, area, [pick(cA[i], area.commute[0]), pick(cB[i], area.commute[1])], search, o);
    })
    .sort(rankListings);
}

/**
 * 跨區房源排行：所有「預算內（含彈性）」且兩人通勤都在上限內的房源一起排名。
 * 為了節省 Google 費用，這裡用區域通勤加步行差估算；打開單一區域時才逐筆精算。
 */
export async function getTopListings(search: SearchRecord, o: ViewOpts, limit = 30): Promise<{ total: number; listings: ListingView[] }> {
  const { input, metrics } = search;
  const scored = evaluate(metrics.areas, input, o.weights, o.includeCost, o.budgetFlex);
  // 只看兩人通勤都在上限內的地區（不看該區行情，避免「行情高就整區被排除」）
  const okAreas = new Map(
    scored.filter((a) => a.commute[0].min <= input.people[0].max && a.commute[1].min <= input.people[1].max).map((a) => [a.pointId, a])
  );
  if (!okAreas.size) return { total: 0, listings: [] };
  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.roomType, input.room), eq(listings.active, true), lte(listings.rent, input.budget + o.budgetFlex), inArray(listings.pointId, [...okAreas.keys()])));
  const views = rows
    .map((l) => {
      const area = okAreas.get(l.pointId)!;
      return toView(l, area, [nearbyCommute(area.commute[0], l.walkMin), nearbyCommute(area.commute[1], l.walkMin)], search, o);
    })
    .filter((v) => !v.overCommute)
    .sort(rankListings);
  return { total: views.length, listings: views.slice(0, limit) };
}

/** 從網址參數讀取權重與預算彈性：?w=4,2,2,2&cost=1&flex=2000（缺少時用搜尋中儲存的值） */
export function viewOptsFromUrl(url: URL, search: SearchRecord): ViewOpts {
  const w = (url.searchParams.get("w") ?? "").split(",").map(Number);
  const flex = url.searchParams.get("flex");
  const parsed = weightsSchema.safeParse({
    weights: { f: w[0], s: w[1], r: w[2], p: w[3] },
    includeCost: url.searchParams.get("cost") !== "0",
    budgetFlex: flex === null ? search.budgetFlex : Number(flex),
  });
  return parsed.success
    ? { weights: parsed.data.weights, includeCost: parsed.data.includeCost, budgetFlex: parsed.data.budgetFlex ?? search.budgetFlex }
    : { weights: search.weights, includeCost: search.includeCost, budgetFlex: search.budgetFlex };
}

/** 使用者自己建立過的搜尋（「我的搜尋」頁） */
export async function listMySearches(userId: string) {
  const rows = await db
    .select({ id: searches.id, input: searches.input, budgetFlex: searches.budgetFlex, createdAt: searches.createdAt })
    .from(searches)
    .where(eq(searches.userId, userId))
    .orderBy(desc(searches.createdAt))
    .limit(50);
  return rows.map((r) => ({ ...r, input: r.input as SearchInput, createdAt: r.createdAt.toISOString() }));
}
