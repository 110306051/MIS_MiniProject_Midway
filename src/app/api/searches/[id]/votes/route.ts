import { NextResponse } from "next/server";
import { getSearch, getVotes, setVote } from "@/lib/server/searches";
import { handle } from "../../../_lib";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/searches/:id/votes：讓對方的頁面定期同步 */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  return NextResponse.json({ votes: await getVotes(id) });
});

/** POST /api/searches/:id/votes  { pointId, person: 0|1, liked } */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const search = await getSearch(id);
  if (!search) return NextResponse.json({ error: "找不到這個搜尋 / Search not found" }, { status: 404 });
  const body = await req.json();
  // 只接受這次搜尋裡真的有的地區
  if (!search.metrics.areas.some((a) => a.pointId === body?.pointId)) return NextResponse.json({ error: "找不到這個地點 / Unknown area" }, { status: 400 });
  return NextResponse.json({ votes: await setVote(id, body) });
});
