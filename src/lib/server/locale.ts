import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE, translator, type Locale } from "../i18n";

/** 伺服器端讀取目前語系（預設中文） */
export async function getLocale(): Promise<Locale> {
  try {
    const v = (await cookies()).get(LOCALE_COOKIE)?.value;
    return isLocale(v) ? v : "zh";
  } catch {
    return "zh";
  }
}

export async function getT() {
  const locale = await getLocale();
  return { locale, L: translator(locale) };
}
