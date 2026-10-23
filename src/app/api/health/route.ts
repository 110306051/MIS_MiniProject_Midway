import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getFeatures } from "@/lib/server/features";

/** GET /api/health：檢查資料庫連線與啟用的功能（部署後用來確認設定） */
export async function GET() {
  let database = "ok";
  try {
    await db.execute(sql`select 1`);
  } catch {
    database = "error";
  }
  const f = getFeatures();
  return NextResponse.json({ database, googleServer: f.googleServer, googleMap: !!f.mapsBrowserKey, llm: f.llm });
}
