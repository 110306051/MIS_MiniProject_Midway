import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** 統一錯誤處理：輸入錯誤回 400，其他回 500 */
export function handle<T extends unknown[]>(fn: (...args: T) => Promise<Response>) {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof ZodError) return NextResponse.json({ error: "輸入資料格式錯誤", issues: e.issues }, { status: 400 });
      console.error(e);
      return NextResponse.json({ error: "伺服器發生錯誤，請稍後再試" }, { status: 500 });
    }
  };
}
