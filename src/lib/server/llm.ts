/**
 * AI 功能（金鑰：ANTHROPIC_API_KEY）
 *  - aiExplain：單一地區的取捨說明
 *  - aiChat：AI 顧問對話
 *  - ruleInsights：沒有金鑰時的規則洞察（也是對話頁的開場摘要）
 */
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { and, eq, inArray, lte } from "drizzle-orm";
import { AMENITIES, FLEX_OPTIONS, ROOM_TYPES, areaName, type Locale, type RoomType } from "../constants";
import { translator } from "../i18n";
import { evaluate, listingTradeoffs, recommend, supplyOf, templateExplain, type Scored } from "../scoring";
import type { SearchInput, SearchRecord } from "../types";
import type { ViewOpts } from "./searches";

export const hasLLM = () => !!process.env.ANTHROPIC_API_KEY;
const MODEL = () => process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";
const fmt = (n: number) => n.toLocaleString("zh-TW");

const textOf = (msg: Anthropic.Message) => msg.content.map((c) => (c.type === "text" ? c.text : "")).join("\n").trim();

/* ---------- 單一地區說明 ---------- */

const langRule = (locale: Locale) => (locale === "en" ? "Reply in natural English. Place names may be given in Chinese; write them in English romanisation (e.g. 新莊 → Xinzhuang)." : "使用繁體中文。");

export async function aiExplain(r: Scored, input: SearchInput, top: Scored | undefined, locale: Locale = "zh"): Promise<{ lines: string[]; source: "llm" | "template" }> {
  if (!hasLLM()) return { lines: templateExplain(r, input, top, locale), source: "template" };
  const [A, B] = input.people;
  const facts = {
    地點: `${r.city}${r.name}`,
    [A.name]: { 工作地: A.workplace.label, 單程通勤分鐘: r.commute[0].min, 可接受上限: A.max, 每週進辦公室: A.days },
    [B.name]: { 工作地: B.workplace.label, 單程通勤分鐘: r.commute[1].min, 可接受上限: B.max, 每週進辦公室: B.days },
    預算: input.budget,
    該區行情: r.supply.market,
    預算內房源數: r.supply.inBudget,
    略超預算可接受的房源數: r.supply.near,
    可接受範圍內最低租金: r.supply.minRent,
    可接受範圍內租金中位數: r.supply.typicalRent,
    兩人每月交通費: r.commuteCost,
    生活機能: Object.fromEntries(AMENITIES.map((a, i) => [a.zh, r.amen[i]])),
    使用者在意的機能: input.prefs.map((p) => AMENITIES.find((a) => a.id === p)?.zh),
    第一名: top && top.pointId !== r.pointId ? { 地點: top.name, [`${A.name}通勤`]: top.commute[0].min, [`${B.name}通勤`]: top.commute[1].min, 可租租金: top.rent } : "這就是第一名",
  };
  try {
    const msg = await new Anthropic().messages.create({
      model: MODEL(),
      max_tokens: 500,
      system: `你是租屋顧問，幫兩位通勤地不同的室友理解一個居住地點的取捨。只根據提供的數據回答，不要編造。語氣中立友善。${langRule(locale)}`,
      messages: [
        {
          role: "user",
          content: `推薦地點的數據（JSON）：\n${JSON.stringify(facts, null, 2)}\n\n請寫 3 到 4 點，每點一行、不超過 50 個字（英文不超過 30 字）、開頭不要加符號：\n1. 兩人通勤是否公平\n2. 租金：該區行情與預算的關係，以及預算內還有多少選擇（行情偏高時，提醒預算內的房子可能較舊、較小或離站較遠）\n3. 和第一名相比的取捨（如果它不是第一名）\n4. 最適合什麼樣的兩人組合`,
        },
      ],
    });
    const lines = textOf(msg).split("\n").map((l) => l.replace(/^\s*(?:[-*•]|\d+[.、)])\s*/, "").trim()).filter(Boolean).slice(0, 5);
    if (!lines.length) throw new Error("empty");
    return { lines, source: "llm" };
  } catch (e) {
    console.error("[llm] explain 失敗，改用模板", e);
    return { lines: templateExplain(r, input, top, locale), source: "template" };
  }
}

/* ---------- 規則洞察 ---------- */

/** 不需要 AI 也能算出的重點：行情偏高但仍有房源的地區、只差一點預算的地區等 */
export function ruleInsights(search: SearchRecord, o: ViewOpts): string[] {
  const { input } = search;
  const locale = o.locale ?? "zh";
  const L = translator(locale);
  const [A, B] = input.people;
  const scored = evaluate(search.metrics.areas, input, o.weights, o.includeCost, o.budgetFlex, locale);
  const picks = recommend(scored);
  const nm = (r: Scored) => areaName(r.pointId, r.name, locale);
  const commuteOk = (r: Scored) => r.commute[0].min <= A.max && r.commute[1].min <= B.max;
  const out: string[] = [];

  if (picks[0]) {
    const t = picks[0];
    const n = t.supply.inBudget + t.supply.near;
    out.push(L(
      `目前第一名是「${t.name}」：${A.name} ${t.commute[0].min} 分、${B.name} ${t.commute[1].min} 分，可接受範圍內有 ${n} 間房源。`,
      `Top pick right now is ${nm(t)}: ${A.name} ${t.commute[0].min} min, ${B.name} ${t.commute[1].min} min, with ${n} homes in range.`
    ));
  } else {
    out.push(L("目前沒有地區同時符合兩人的通勤上限與預算，可以放寬通勤上限或打開預算彈性。", "No area fits both commute limits and the budget yet. Try a longer commute limit or some budget flex."));
  }

  const pricey = scored.filter((r) => r.eligible && r.supply.pricey).sort((a, b) => b.S - a.S).slice(0, 3);
  for (const r of pricey) {
    const n = r.supply.inBudget + r.supply.near;
    out.push(L(
      `「${r.name}」行情約 ${fmt(r.supply.market)} 元，高於預算，但仍有 ${n} 間可接受（最低 ${fmt(r.supply.minRent ?? 0)} 元），多半是屋齡較舊、坪數較小或離站較遠的房子。`,
      `${nm(r)} usually rents for about NT$${fmt(r.supply.market)}, above budget, yet ${n} homes still fit (from NT$${fmt(r.supply.minRent ?? 0)}) — mostly older, smaller or farther from the station.`
    ));
  }

  // 通勤可以、但預算內沒房子：試算放寬預算彈性能不能救回來
  const blocked = scored.filter((r) => !r.eligible && commuteOk(r)).sort((a, b) => b.raw.f + b.raw.s - (a.raw.f + a.raw.s)).slice(0, 3);
  for (const r of blocked) {
    const more = FLEX_OPTIONS.find((f) => f > o.budgetFlex && supplyOf(r, input.budget, f).inBudget + supplyOf(r, input.budget, f).near >= 2);
    out.push(
      more
        ? L(`「${r.name}」兩人通勤都在上限內，但預算內房源太少；如果預算彈性放寬到 +${fmt(more)}，就會有足夠的選擇。`, `${nm(r)} works for both commutes but has too few homes in budget. Allow +NT$${fmt(more)} and it opens up.`)
        : L(`「${r.name}」兩人通勤都在上限內，但行情約 ${fmt(r.supply.market)} 元，預算內幾乎找不到房子。`, `${nm(r)} works for both commutes, but at about NT$${fmt(r.supply.market)} there is almost nothing in budget.`)
    );
  }

  const most = scored.filter((r) => r.eligible).sort((a, b) => b.supply.inBudget + b.supply.near - (a.supply.inBudget + a.supply.near))[0];
  if (most) {
    const n = most.supply.inBudget + most.supply.near;
    const pct = Math.round(most.supply.share * 100);
    out.push(L(`選擇最多的是「${most.name}」，可接受範圍內有 ${n} 間（約占 ${pct}%）。`, `Most choice: ${nm(most)}, with ${n} homes in range (about ${pct}%).`));
  }
  return out;
}

/* ---------- AI 顧問對話 ---------- */

export type ChatMessage = { role: "user" | "assistant"; content: string };

async function chatContext(search: SearchRecord, o: ViewOpts) {
  const { input } = search;
  const [A, B] = input.people;
  const scored = evaluate(search.metrics.areas, input, o.weights, o.includeCost, o.budgetFlex);
  const picks = recommend(scored);
  const commuteOk = scored.filter((r) => r.commute[0].min <= A.max && r.commute[1].min <= B.max);

  // 行情偏高、但通勤可以的地區：附上預算內最便宜的幾間，讓 AI 能具體說明取捨
  const priceyIds = commuteOk.filter((r) => r.supply.pricey).map((r) => r.pointId);
  const cheap = priceyIds.length
    ? await db
        .select()
        .from(listings)
        .where(and(eq(listings.roomType, input.room), eq(listings.active, true), lte(listings.rent, input.budget + o.budgetFlex), inArray(listings.pointId, priceyIds)))
    : [];

  return {
    說明: "房源與租金行情為模擬資料；通勤時間來源：" + (search.metrics.commuteSource === "estimate" ? "估算模型" : "Google 尖峰時段"),
    兩人: input.people.map((p) => ({ 名字: p.name, 工作地: p.workplace.label, 每週進辦公室: p.days, 單程通勤上限分鐘: p.max })),
    房型: ROOM_TYPES.find((r) => r.id === input.room)?.zh,
    每月租金預算: input.budget,
    預算彈性: o.budgetFlex ? `可接受超出 ${o.budgetFlex} 元` : "不接受超出預算",
    在意的生活機能: input.prefs.map((p) => AMENITIES.find((a) => a.id === p)?.zh),
    權重: o.weights,
    推薦方案: picks.map((p, i) => ({ 名次: i + 1, 地區: p.name, 標籤: p.tags, 總分: +p.S.toFixed(2), [`${A.name}通勤`]: p.commute[0].min, [`${B.name}通勤`]: p.commute[1].min, 行情: p.supply.market, 可接受房源數: p.supply.inBudget + p.supply.near, 最低租金: p.supply.minRent })),
    所有地區: scored.map((r) => ({
      地區: `${r.city}${r.name}`,
      [`${A.name}通勤`]: r.commute[0].min,
      [`${B.name}通勤`]: r.commute[1].min,
      行情: r.supply.market,
      預算內房源: r.supply.inBudget,
      略超預算房源: r.supply.near,
      房源總數: r.supply.total,
      是否推薦: r.eligible ? "符合條件" : `未推薦：${r.reasons.join("；")}`,
    })),
    行情偏高地區的可負擔房源: cheap.map((l) => {
      const area = scored.find((r) => r.pointId === l.pointId)!;
      return { 地區: area.name, 名稱: l.title, 租金: l.rent, 坪數: l.ping, 屋齡: l.age, 電梯: l.elevator, 離站步行分鐘: l.walkMin, 取捨: listingTradeoffs(l, area.supply.market, input.room as RoomType).tradeoffs };
    }),
  };
}

function trimHistory(messages: ChatMessage[]) {
  const recent = messages.slice(-10);
  while (recent.length && recent[0].role !== "user") recent.shift();
  return recent;
}

export async function aiChat(search: SearchRecord, o: ViewOpts, messages: ChatMessage[]): Promise<string> {
  const context = await chatContext(search, o);
  const msg = await new Anthropic().messages.create({
    model: MODEL(),
    max_tokens: 900,
    system: `你是「Midway 中途租」的租屋顧問，協助兩位通勤地不同的人決定一起住在哪裡。

規則：
- 只根據下方 <data> 的數據回答；資料沒有的就說不知道，不要編造地名、價格或通勤時間。
- ${langRule(o.locale ?? "zh")}語氣友善、直接，回答控制在 200 字內（英文 150 words 內），必要時用條列。
- 解釋取捨時要具體：例如某區行情高於預算，但仍有幾間便宜的房子，並說明它們的代價（屋齡、坪數、離站距離、無電梯）。
- 公平對待兩個人，不偏袒任何一方。
- 提醒時機：使用者打算做決定時，提醒房源為模擬資料，實際仍需看房確認。

<data>
${JSON.stringify(context)}
</data>`,
    // 只送最近 10 則；Claude 要求第一則必須是使用者訊息
    messages: trimHistory(messages).map((m) => ({ role: m.role, content: m.content.slice(0, 1000) })),
  });
  return textOf(msg);
}
