import { NextResponse } from "next/server";
import { z } from "zod";
import { aiChat, hasLLM, ruleInsights } from "@/lib/server/llm";
import { getSearch, weightsSchema } from "@/lib/server/searches";
import { handle } from "../../../_lib";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = weightsSchema.extend({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) })).max(30),
});

/**
 * POST /api/searches/:id/chat  { weights, includeCost, budgetFlex, messages }
 * - messages 為空：回傳規則洞察 { insights, llm }
 * - 有 messages：回傳 AI 回覆 { reply }（需要 ANTHROPIC_API_KEY）
 */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const search = await getSearch(id);
  if (!search) return NextResponse.json({ error: "找不到這個搜尋" }, { status: 404 });
  const { messages, weights, includeCost, budgetFlex } = bodySchema.parse(await req.json());
  const o = { weights, includeCost, budgetFlex: budgetFlex ?? search.budgetFlex };

  if (!messages.length) return NextResponse.json({ insights: ruleInsights(search, o), llm: hasLLM() });
  if (!hasLLM()) return NextResponse.json({ error: "尚未設定 ANTHROPIC_API_KEY，AI 對話無法使用" }, { status: 501 });
  if (messages.at(-1)?.role !== "user") return NextResponse.json({ error: "最後一則必須是使用者訊息" }, { status: 400 });
  try {
    return NextResponse.json({ reply: await aiChat(search, o, messages) });
  } catch (e) {
    console.error("[chat]", e);
    return NextResponse.json({ error: "AI 暫時無法回覆，請稍後再試" }, { status: 502 });
  }
});
