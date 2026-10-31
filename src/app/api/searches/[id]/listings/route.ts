import { NextResponse } from "next/server";
import { getSearch, getTopListings, viewOptsFromUrl } from "@/lib/server/searches";
import { getLocale } from "@/lib/server/locale";
import { handle } from "../../../_lib";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/searches/:id/listings?w=4,2,2,2&cost=1&flex=2000 → 跨區房源排行（預算內＋彈性） */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const search = await getSearch(id);
  if (!search) return NextResponse.json({ error: "找不到這個搜尋" }, { status: 404 });
  return NextResponse.json(await getTopListings(search, { ...viewOptsFromUrl(new URL(req.url), search), locale: await getLocale() }));
});
