import { NextResponse } from "next/server";
import { hasGoogleServer, placeDetails } from "@/lib/server/google";
import { handle } from "../../_lib";

/** GET /api/places/details?id=<placeId>&session=xxx → { label, address, lat, lng } */
export const GET = handle(async (req: Request) => {
  if (!hasGoogleServer()) return NextResponse.json({ error: "未設定 Google 金鑰" }, { status: 501 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  return NextResponse.json(await placeDetails(id, url.searchParams.get("session") ?? undefined));
});
