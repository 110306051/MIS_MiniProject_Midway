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
  if (!(await getSearch(id))) return NextResponse.json({ error: "找不到這個搜尋" }, { status: 404 });
  return NextResponse.json({ votes: await setVote(id, await req.json()) });
});
