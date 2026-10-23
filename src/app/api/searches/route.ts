import { NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { createSearch } from "@/lib/server/searches";
import { handle } from "../_lib";

/** POST /api/searches：建立搜尋，回傳 { id } */
export const POST = handle(async (req: Request) => {
  // 有登入就把搜尋存到帳號底下；沒登入也能使用
  const session = await auth.api.getSession({ headers: req.headers });
  const id = await createSearch(await req.json(), session?.user.id ?? null);
  return NextResponse.json({ id }, { status: 201 });
});
