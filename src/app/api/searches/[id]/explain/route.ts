import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluate, recommend } from "@/lib/scoring";
import { aiExplain } from "@/lib/server/llm";
import { getSearch, weightsSchema } from "@/lib/server/searches";
import { handle } from "../../../_lib";

type Ctx = { params: Promise<{ id: string }> };
const bodySchema = weightsSchema.extend({ pointId: z.string().max(60) });

/** POST /api/searches/:id/explain  { pointId, weights, includeCost, budgetFlex } → { lines, source } */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const { pointId, weights, includeCost, budgetFlex } = bodySchema.parse(await req.json());
  const search = await getSearch(id);
  if (!search) return NextResponse.json({ error: "找不到這個搜尋" }, { status: 404 });
  const scored = evaluate(search.metrics.areas, search.input, weights, includeCost, budgetFlex ?? search.budgetFlex);
  const target = scored.find((s) => s.pointId === pointId);
  if (!target) return NextResponse.json({ error: "找不到這個地點" }, { status: 404 });
  const top = recommend(scored)[0];
  return NextResponse.json(await aiExplain(target, search.input, top));
});
