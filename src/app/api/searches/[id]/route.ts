import { NextResponse } from "next/server";
import { getSearch, getVotes, updateWeights } from "@/lib/server/searches";
import { handle } from "../../_lib";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/searches/:id：搜尋內容與投票 */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  const search = await getSearch(id);
  if (!search) return NextResponse.json({ error: "找不到這個搜尋" }, { status: 404 });
  return NextResponse.json({ search, votes: await getVotes(id) });
});

/** PATCH /api/searches/:id：更新權重 { weights, includeCost } */
export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const ok = await updateWeights(id, await req.json());
  return ok ? NextResponse.json({ ok }) : NextResponse.json({ error: "找不到這個搜尋" }, { status: 404 });
});
