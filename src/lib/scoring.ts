/**
 * 推薦評分（前後端共用的純函式）
 *   S = w_f·f + w_s·s + w_r·r + w_p·p
 *   f 公平 = 1 − max(t_A/T_A, t_B/T_B)
 *   s 省時 = 1 − (d_A·t_A + d_B·t_B) / (d_A·T_A + d_B·T_B)
 *   r 成本 = 1 − 每月成本 / 預算        （地區的租金 = 「預算內房源」的中位數）
 *   p 機能 = 所選生活機能分數平均
 *
 * 地區是否推薦，不看行情平均價，而看「預算內（含彈性）找不找得到房子」。
 */
import { AMENITIES, MIN_SUPPLY, TPASS, TYPICAL_PING, WEEKS_PER_MONTH, areaName, viaName, type Locale, type RoomType } from "./constants";
import { translator } from "./i18n";
import type { AreaMetric, Commute, SearchInput, Weights } from "./types";

export type Raw = { f: number; s: number; r: number; p: number };

/** 地區的供給狀況 */
export type Supply = {
  /** 該區行情（中位數） */
  market: number;
  /** 房源總數 */
  total: number;
  /** 預算內房源數 */
  inBudget: number;
  /** 超出預算但在彈性範圍內的房源數 */
  near: number;
  /** 可選房源（預算內＋彈性）中最便宜的租金 */
  minRent: number | null;
  /** 可選房源的租金中位數：這是你們「實際會租到」的價格，用來計算成本分數 */
  typicalRent: number;
  /** 可選房源占比 */
  share: number;
  /** 行情是否高於預算 */
  pricey: boolean;
};

export type Scored = AreaMetric & {
  rent: number;
  supply: Supply;
  cost: number;
  commuteCost: number;
  shareA: number;
  shareB: number;
  raw: Raw;
  parts: Raw;
  w: Raw;
  S: number;
  eligible: boolean;
  reasons: string[];
};

export type Pick = Scored & { tags: string[] };

export function normalizeWeights(w: Weights): Raw {
  const sum = w.f + w.s + w.r + w.p;
  // 四個權重都拉到 0 時，視為同等重要，避免所有分數變成 0
  if (sum <= 0) return { f: 0.25, s: 0.25, r: 0.25, p: 0.25 };
  return { f: w.f / sum, s: w.s / sum, r: w.r / sum, p: w.p / sum };
}

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

export function supplyOf(area: AreaMetric, budget: number, flex: number): Supply {
  const market = area.market ?? area.rent;
  // 舊版搜尋沒有房源清單：沿用「行情是否在預算內」的判斷，避免舊的分享連結全部變成不推薦
  const rents = area.rents?.length ? area.rents : Array(MIN_SUPPLY).fill(market);
  const pool = rents.filter((r) => r <= budget + flex);
  const inBudget = rents.filter((r) => r <= budget).length;
  return {
    market,
    total: rents.length,
    inBudget,
    near: pool.length - inBudget,
    minRent: pool.length ? Math.min(...pool) : null,
    typicalRent: pool.length ? median(pool) : market,
    share: rents.length ? pool.length / rents.length : 0,
    pricey: market > budget,
  };
}

type ScoreArgs = { rent: number; amen: number[]; commute: [Commute, Commute] };

/** 對任一個「地點或房源」計分。budgetCap：可接受的最高租金（預算＋彈性） */
export function scoreOne(x: ScoreArgs, input: SearchInput, weights: Weights, includeCost: boolean, budgetCap = input.budget, locale: Locale = "zh") {
  const L = translator(locale);
  const [A, B] = input.people;
  const [cA, cB] = x.commute;
  const w = normalizeWeights(weights);
  const commuteCost = cA.cost + cB.cost;
  const cost = x.rent + (includeCost ? commuteCost : 0);
  const budget = input.budget + (includeCost ? 2 * TPASS : 0);
  const prefIdx = input.prefs.map((id) => AMENITIES.findIndex((a) => a.id === id)).filter((i) => i >= 0);

  const raw: Raw = {
    f: 1 - Math.max(cA.min / A.max, cB.min / B.max),
    s: 1 - (A.days * cA.min + B.days * cB.min) / (A.days * A.max + B.days * B.max),
    r: 1 - cost / budget,
    p: prefIdx.length ? prefIdx.reduce((t, i) => t + (x.amen[i] ?? 0), 0) / prefIdx.length : 0.5,
  };
  const parts: Raw = { f: w.f * raw.f, s: w.s * raw.s, r: w.r * raw.r, p: w.p * raw.p };

  const reasons: string[] = [];
  for (const [p, c] of [[A, cA], [B, cB]] as const) {
    if (c.min > p.max) reasons.push(L(`${p.name}通勤 ${c.min} 分，超過上限 ${p.max} 分`, `${p.name}'s commute is ${c.min} min, over the ${p.max}-min limit`));
  }
  if (x.rent > budgetCap) reasons.push(L(`租金 ${x.rent.toLocaleString()} 超過預算`, `Rent ${x.rent.toLocaleString()} is over budget`));

  const shareA = Math.round((x.rent * input.splitA) / 100);
  return { raw, parts, w, S: parts.f + parts.s + parts.r + parts.p, cost, commuteCost, shareA, shareB: x.rent - shareA, reasons, eligible: reasons.length === 0 };
}

export function evaluate(areas: AreaMetric[], input: SearchInput, weights: Weights, includeCost: boolean, flex = 0, locale: Locale = "zh"): Scored[] {
  const L = translator(locale);
  return areas.map((a) => {
    const supply = supplyOf(a, input.budget, flex);
    const s = scoreOne({ ...a, rent: supply.typicalRent }, input, weights, includeCost, Infinity, locale);
    const available = supply.inBudget + supply.near;
    if (available < MIN_SUPPLY) {
      const m = supply.market.toLocaleString();
      s.reasons.push(
        available === 0
          ? L(`預算${flex ? `＋${flex.toLocaleString()}` : ""}內沒有房源（行情 ${m}）`, `No homes within budget${flex ? ` + ${flex.toLocaleString()}` : ""} (typical rent ${m})`)
          : L(`預算內只有 ${available} 間房源，選擇太少`, `Only ${available} home within budget — too few to choose from`)
      );
      s.eligible = false;
    }
    return { ...a, ...s, rent: supply.typicalRent, supply };
  });
}

/** 挑出最多 5 個推薦方案，保證包含各類型的代表 */
export function recommend(scored: Scored[]): Pick[] {
  const ok = scored.filter((r) => r.eligible).sort((a, b) => b.S - a.S);
  if (!ok.length) return [];
  const best = (fn: (r: Scored) => number) => ok.reduce((m, r) => (fn(r) > fn(m) ? r : m), ok[0]);
  const tags = new Map<Scored, string[]>();
  const tag = (r: Scored, t: string) => tags.set(r, [...(tags.get(r) ?? []), t]);
  tag(ok[0], "綜合最佳");
  tag(best((r) => r.raw.f), "最公平");
  tag(best((r) => r.raw.s), "最省時");
  tag(best((r) => -r.cost), "最省錢");
  tag(best((r) => r.raw.p), "生活機能最好");
  tag(best((r) => r.supply.inBudget + r.supply.near), "選擇最多");
  const picks = [...tags.keys()];
  // 標籤可能分散在超過 5 個地區：依總分保留前 5，其餘補上總分高的地區
  const chosen = picks.sort((a, b) => b.S - a.S).slice(0, 5);
  for (const r of ok) {
    if (chosen.length >= 5) break;
    if (!chosen.includes(r)) chosen.push(r);
  }
  return chosen.sort((a, b) => b.S - a.S).map((r) => ({ ...r, tags: tags.get(r) ?? [] }));
}

/** 一句話描述地區的租金與供給 */
export function supplySentence(r: Scored, budget: number, locale: Locale = "zh") {
  const L = translator(locale);
  const s = r.supply;
  const n = s.inBudget + s.near;
  const pct = Math.round(s.share * 100);
  const m = s.market.toLocaleString();
  const nearText = s.near ? L(`（其中 ${s.near} 間略超預算）`, ` (${s.near} slightly over budget)`) : "";
  if (s.pricey) {
    return L(
      `這區行情約 ${m} 元，高於預算；但仍有 ${n} 間在可接受範圍內${nearText}，約占 ${pct}%，最低 ${s.minRent?.toLocaleString()} 元。這些通常是屋齡較舊、坪數較小或離站較遠的房子。`,
      `Typical rent here is about NT$${m}, above your budget — but ${n} homes still fit${nearText}, about ${pct}% of the area, from NT$${s.minRent?.toLocaleString()}. These tend to be older, smaller or farther from the station.`
    );
  }
  const gap = (budget - s.market).toLocaleString();
  return L(
    `這區行情約 ${m} 元，比預算低 ${gap} 元；有 ${n} 間在可接受範圍內${nearText}，約占 ${pct}%，選擇充足。`,
    `Typical rent here is about NT$${m}, NT$${gap} under budget; ${n} homes fit${nearText}, about ${pct}% — plenty to choose from.`
  );
}

/** 規則模板版的取捨說明（沒有 LLM 金鑰時使用，也是 LLM 的備援） */
export function templateExplain(r: Scored, input: SearchInput, top?: Scored, locale: Locale = "zh"): string[] {
  const L = translator(locale);
  const [A, B] = input.people;
  const [cA, cB] = r.commute;
  const out: string[] = [];
  const diff = Math.abs(cA.min - cB.min);
  const longer = cA.min >= cB.min ? A.name : B.name;
  out.push(
    L(
      `${A.name}${cA.via}約 ${cA.min} 分、${B.name}${cB.via}約 ${cB.min} 分，` + (diff <= 10 ? `兩人只差 ${diff} 分鐘，負擔相當平均。` : `${longer}每天多通勤 ${diff} 分鐘，負擔比較重。`),
      `${A.name}: about ${cA.min} min (${viaName(cA.via, "en")}); ${B.name}: about ${cB.min} min (${viaName(cB.via, "en")}). ` +
        (diff <= 10 ? `Only ${diff} min apart — a fair split.` : `${longer} rides ${diff} min longer each way and carries more of the load.`)
    )
  );
  out.push(supplySentence(r, input.budget, locale));
  const strong = AMENITIES.filter((_, i) => (r.amen[i] ?? 0) >= 0.8).map((a) => a[locale]);
  if (strong.length) out.push(L(`生活機能強項：${strong.join("、")}。`, `Strong on: ${strong.join(", ")}.`));
  if (top && top.pointId !== r.pointId) {
    const hours = (days: number, a: number, b: number) => Math.round(((b - a) * 2 * days * WEEKS_PER_MONTH) / 60);
    const bits: string[] = [];
    const rentDiff = top.rent - r.rent;
    const rd = Math.abs(rentDiff).toLocaleString();
    if (rentDiff > 0) bits.push(L(`租金約省 ${rd} 元`, `about NT$${rd} less rent`));
    if (rentDiff < 0) bits.push(L(`租金約多 ${rd} 元`, `about NT$${rd} more rent`));
    for (const [p, h] of [[A, hours(A.days, top.commute[0].min, cA.min)], [B, hours(B.days, top.commute[1].min, cB.min)]] as const) {
      if (h) bits.push(L(`${p.name}每月${h > 0 ? "多" : "少"}通勤約 ${Math.abs(h)} 小時`, `${p.name} commutes ~${Math.abs(h)} h/month ${h > 0 ? "more" : "less"}`));
    }
    const topName = areaName(top.pointId, top.name, locale);
    if (bits.length) out.push(L(`和第一名「${top.name}」相比：${bits.join("，")}。`, `Compared with #1 ${topName}: ${bits.join(", ")}.`));
  }
  const names: Record<keyof Raw, [string, string]> = { f: ["公平性", "fairness"], s: ["總通勤時間", "total commute time"], r: ["成本", "cost"], p: ["生活機能", "amenities"] };
  const weakest = (Object.entries(r.raw) as [keyof Raw, number][]).sort((a, b) => a[1] - b[1])[0][0];
  out.push(L(`主要取捨在${names[weakest][0]}。`, `The main trade-off is ${names[weakest][1]}.`));
  return out;
}

/** 房源的取捨：為什麼比行情便宜（或貴） */
export function listingTradeoffs(l: { rent: number; age: number; walkMin: number; ping: number; elevator: boolean; floor: string }, market: number, room: RoomType, locale: Locale = "zh") {
  const L = translator(locale);
  const vsMarketPct = market ? Math.round(((l.rent - market) / market) * 100) : 0;
  const notes: string[] = [];
  if (l.age >= 30) notes.push(L(`屋齡 ${l.age} 年`, `${l.age} years old`));
  if (l.walkMin >= 12) notes.push(L(`離站步行 ${l.walkMin} 分`, `${l.walkMin} min walk to station`));
  if (l.ping < TYPICAL_PING[room] * 0.9) notes.push(L(`坪數較小（${l.ping} 坪）`, `Small (${l.ping} ping)`));
  const floorNo = parseInt(l.floor, 10);
  if (!l.elevator && floorNo >= 4) notes.push(L(`無電梯 ${floorNo} 樓`, `Walk-up, floor ${floorNo}`));
  return { vsMarketPct, tradeoffs: notes };
}
