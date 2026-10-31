"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE } from "@/lib/i18n";
import { useL } from "./LocaleProvider";

/** 中／EN 切換：寫入 cookie 後重新整理伺服器元件 */
export default function LangToggle() {
  const { locale } = useL();
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (l: "zh" | "en") => {
    if (l === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l === "en" ? "en" : "zh-Hant";
    start(() => router.refresh());
  };
  return (
    <div className={`lang ${pending ? "busy" : ""}`} role="group" aria-label="Language">
      <button type="button" aria-pressed={locale === "zh"} onClick={() => set("zh")} lang="zh-Hant">
        中
      </button>
      <button type="button" aria-pressed={locale === "en"} onClick={() => set("en")} lang="en">
        EN
      </button>
    </div>
  );
}
