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
import { AMENITIES, MIN_SUPPLY, TPASS, TYPICAL_PING, WEEKS_PER_MONTH, type RoomType } from "./constants";
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
  const sum = w.f + w.s + w.r + w.p || 1;
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
export function scoreOne(x: ScoreArgs, input: SearchInput, weights: Weights, includeCost: boolean, budgetCap = input.budget) {
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
  if (cA.min > A.max) reasons.push(`${A.name}通勤 ${cA.min} 分，超過上限 ${A.max} 分`);
  if (cB.min > B.max) reasons.push(`${B.name}通勤 ${cB.min} 分，超過上限 ${B.max} 分`);
  if (x.rent > budgetCap) reasons.push(`租金 ${x.rent.toLocaleString()} 超過預算`);

  const shareA = Math.round((x.rent * input.splitA) / 100);
  return { raw, parts, w, S: parts.f + parts.s + parts.r + parts.p, cost, commuteCost, shareA, shareB: x.rent - shareA, reasons, eligible: reasons.length === 0 };
}

export function evaluate(areas: AreaMetric[], input: SearchInput, weights: Weights, includeCost: boolean, flex = 0): Scored[] {
  return areas.map((a) => {
    const supply = supplyOf(a, input.budget, flex);
    const s = scoreOne({ ...a, rent: supply.typicalRent }, input, weights, includeCost, Infinity);
    const available = supply.inBudget + supply.near;
    if (available < MIN_SUPPLY) {
      s.reasons.push(
        available === 0
          ? `預算${flex ? `＋${flex.toLocaleString()}` : ""}內沒有房源（行情 ${supply.market.toLocaleString()}）`
          : `預算內只有 ${available} 間房源，選擇太少`
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
export function supplySentence(r: Scored, budget: number) {
  const s = r.supply;
  const n = s.inBudget + s.near;
  const pct = Math.round(s.share * 100);
  const nearText = s.near ? `（其中 ${s.near} 間略超預算）` : "";
  if (s.pricey) {
    return `這區行情約 ${s.market.toLocaleString()} 元，高於預算；但仍有 ${n} 間在可接受範圍內${nearText}，約占 ${pct}%，最低 ${s.minRent?.toLocaleString()} 元。這些通常是屋齡較舊、坪數較小或離站較遠的房子。`;
  }
  const gap = budget - s.market;
  return `這區行情約 ${s.market.toLocaleString()} 元，比預算低 ${gap.toLocaleString()} 元；有 ${n} 間在可接受範圍內${nearText}，約占 ${pct}%，選擇充足。`;
}

/** 規則模板版的取捨說明（沒有 LLM 金鑰時使用，也是 LLM 的備援） */
export function templateExplain(r: Scored, input: SearchInput, top?: Scored): string[] {
  const [A, B] = input.people;
  const [cA, cB] = r.commute;
  const out: string[] = [];
  const diff = Math.abs(cA.min - cB.min);
  const longer = cA.min >= cB.min ? A.name : B.name;
  out.push(
    `${A.name}${cA.via}約 ${cA.min} 分、${B.name}${cB.via}約 ${cB.min} 分，` +
      (diff <= 10 ? `兩人只差 ${diff} 分鐘，負擔相當平均。` : `${longer}每天多通勤 ${diff} 分鐘，負擔比較重。`)
  );
  out.push(supplySentence(r, input.budget));
  const strong = AMENITIES.filter((_, i) => (r.amen[i] ?? 0) >= 0.8).map((a) => a.name);
  if (strong.length) out.push(`生活機能強項：${strong.join("、")}。`);
  if (top && top.pointId !== r.pointId) {
    const hours = (days: number, a: number, b: number) => Math.round(((b - a) * 2 * days * WEEKS_PER_MONTH) / 60);
    const bits: string[] = [];
    const rentDiff = top.rent - r.rent;
    if (rentDiff > 0) bits.push(`租金約省 ${rentDiff.toLocaleString()} 元`);
    if (rentDiff < 0) bits.push(`租金約多 ${(-rentDiff).toLocaleString()} 元`);
    const hA = hours(A.days, top.commute[0].min, cA.min);
    const hB = hours(B.days, top.commute[1].min, cB.min);
    if (hA) bits.push(`${A.name}每月${hA > 0 ? "多" : "少"}通勤約 ${Math.abs(hA)} 小時`);
    if (hB) bits.push(`${B.name}每月${hB > 0 ? "多" : "少"}通勤約 ${Math.abs(hB)} 小時`);
    if (bits.length) out.push(`和第一名「${top.name}」相比：${bits.join("，")}。`);
  }
  const names: Record<keyof Raw, string> = { f: "公平性", s: "總通勤時間", r: "成本", p: "生活機能" };
  const weakest = (Object.entries(r.raw) as [keyof Raw, number][]).sort((a, b) => a[1] - b[1])[0][0];
  out.push(`主要取捨在${names[weakest]}。`);
  return out;
}

/** 房源的取捨：為什麼比行情便宜（或貴） */
export function listingTradeoffs(l: { rent: number; age: number; walkMin: number; ping: number; elevator: boolean; floor: string }, market: number, room: RoomType) {
  const vsMarketPct = market ? Math.round(((l.rent - market) / market) * 100) : 0;
  const notes: string[] = [];
  if (l.age >= 30) notes.push(`屋齡 ${l.age} 年`);
  if (l.walkMin >= 12) notes.push(`離站步行 ${l.walkMin} 分`);
  if (l.ping < TYPICAL_PING[room] * 0.9) notes.push(`坪數較小（${l.ping} 坪）`);
  const floorNo = parseInt(l.floor, 10);
  if (!l.elevator && floorNo >= 4) notes.push(`無電梯 ${floorNo} 樓`);
  return { vsMarketPct, tradeoffs: notes };
}
