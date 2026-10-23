import { NextResponse } from "next/server";
import { hasGoogleServer, placesAutocomplete } from "@/lib/server/google";
import { handle } from "../../_lib";

/** GET /api/places/autocomplete?q=台北101&session=xxx */
export const GET = handle(async (req: Request) => {
  if (!hasGoogleServer()) return NextResponse.json({ error: "未設定 Google 金鑰" }, { status: 501 });
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ suggestions: [] });
  return NextResponse.json({ suggestions: await placesAutocomplete(q, url.searchParams.get("session") ?? undefined) });
});
