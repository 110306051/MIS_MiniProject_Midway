/**
 * 中英文切換（輕量版）
 * - 語系存在 cookie「midway-locale」，伺服器與瀏覽器都讀得到
 * - 文字直接寫在元件裡：L("中文", "English")，維護時兩種語言放在一起比較不會漏
 */
import type { Locale } from "./constants";

export type { Locale };
export const LOCALE_COOKIE = "midway-locale";
export const LOCALES: Locale[] = ["zh", "en"];
export const isLocale = (v: unknown): v is Locale => v === "zh" || v === "en";

export type Translate = (zh: string, en: string) => string;
export const translator = (locale: Locale): Translate => (zh, en) => (locale === "en" ? en : zh);

/** 數字格式 */
export const fmtNum = (n: number) => Math.round(n).toLocaleString("en-US");

/** 推薦標籤（scoring.ts 以中文當 id） */
export const TAG_EN: Record<string, string> = {
  綜合最佳: "Best overall", 最公平: "Fairest", 最省時: "Least time", 最省錢: "Cheapest", 生活機能最好: "Best amenities", 選擇最多: "Most choice",
};
export const tagName = (t: string, locale: Locale) => (locale === "en" ? TAG_EN[t] ?? t : t);
