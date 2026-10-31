"use client";

import { createContext, useContext, useMemo } from "react";
import { translator, type Locale, type Translate } from "@/lib/i18n";

const Ctx = createContext<{ locale: Locale; L: Translate }>({ locale: "zh", L: translator("zh") });

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, L: translator(locale) }), [locale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** 在用戶端元件取得語系與翻譯函式 */
export const useL = () => useContext(Ctx);
