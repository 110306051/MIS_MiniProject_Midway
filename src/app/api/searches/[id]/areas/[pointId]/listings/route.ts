import { NextResponse } from "next/server";
import { getAreaListings, getSearch, viewOptsFromUrl } from "@/lib/server/searches";
import { handle } from "../../../../../_lib";

type Ctx = { params: Promise<{ id: string; pointId: string }> };

/** GET /api/searches/:id/areas/:pointId/listings?w=4,2,2,2&cost=1&flex=2000 → 區域內所有房源（逐筆通勤、分數、取捨） */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const { id, pointId } = await params;
  const search = await getSearch(id);
  if (!search) return NextResponse.json({ error: "找不到這個搜尋" }, { status: 404 });
  return NextResponse.json({ listings: await getAreaListings(search, pointId, viewOptsFromUrl(new URL(req.url), search)) });
});
