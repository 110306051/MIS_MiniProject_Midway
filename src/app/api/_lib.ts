import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getLocale } from "@/lib/server/locale";

/** 統一錯誤處理：輸入錯誤（含 JSON 格式錯誤）回 400，其他回 500；訊息依語系 */
export function handle<T extends unknown[]>(fn: (...args: T) => Promise<Response>) {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (e) {
      const en = (await getLocale()) === "en";
      if (e instanceof ZodError) return NextResponse.json({ error: en ? "Some of the input is invalid" : "輸入資料格式錯誤", issues: e.issues }, { status: 400 });
      if (e instanceof SyntaxError) return NextResponse.json({ error: en ? "The request body is not valid JSON" : "送出的資料不是有效的 JSON" }, { status: 400 });
      console.error(e);
      return NextResponse.json({ error: en ? "Something went wrong on the server. Please try again." : "伺服器發生錯誤，請稍後再試" }, { status: 500 });
    }
  };
}
