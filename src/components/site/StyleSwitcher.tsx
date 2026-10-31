"use client";

import { useEffect, useRef, useState } from "react";
import { FONT_COOKIE, FONTS, THEME_COOKIE, THEMES, findFont } from "@/lib/themes";
import { useL } from "./LocaleProvider";

const setCookie = (k: string, v: string) => (document.cookie = `${k}=${v}; path=/; max-age=31536000; samesite=lax`);

/** 需要時才載入該字體組合的 Google Fonts */
export function ensureFont(id: string) {
  const f = findFont(id);
  if (document.querySelector(`link[data-font-id="${f.id}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = f.href;
  link.dataset.fontId = f.id;
  document.head.appendChild(link);
}

/** 右下角的「風格」面板：切換配色與字體，存在 cookie，重新整理也會保留 */
export default function StyleSwitcher({ theme: initTheme, font: initFont }: { theme: string; font: string }) {
  const { L, locale } = useL();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(initTheme);
  const [font, setFont] = useState(initFont);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    FONTS.forEach((f) => ensureFont(f.id)); // 打開面板時載入各字體，讓預覽字樣正確
    const onDown = (e: MouseEvent) => !panel.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pickTheme = (id: string) => {
    setTheme(id);
    document.documentElement.dataset.theme = id;
    setCookie(THEME_COOKIE, id);
    window.dispatchEvent(new Event("midway-theme"));
  };
  const pickFont = (id: string) => {
    ensureFont(id);
    setFont(id);
    document.documentElement.dataset.font = id;
    setCookie(FONT_COOKIE, id);
  };

  return (
    <div className="styler" ref={panel}>
      {open && (
        <div className="styler-panel" role="dialog" aria-label={L("配色與字體", "Colours & fonts")}>
          <h4>{L("配色", "Colours")}</h4>
          <div className="styler-themes">
            {THEMES.map((t) => (
              <button key={t.id} type="button" aria-pressed={theme === t.id} onClick={() => pickTheme(t.id)}>
                <span className="sw">
                  {t.swatches.map((c) => (
                    <i key={c} style={{ background: c }} />
                  ))}
                </span>
                {t[locale]}
              </button>
            ))}
          </div>
          <h4>{L("字體", "Fonts")}</h4>
          <div className="styler-fonts">
            {FONTS.map((f) => (
              <button key={f.id} type="button" aria-pressed={font === f.id} onClick={() => pickFont(f.id)} onMouseEnter={() => ensureFont(f.id)}>
                <b data-font-preview={f.id}>Aa 中途</b>
                <span>
                  {f[locale]}
                  <small>{f.sample}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <button type="button" className="styler-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)} aria-label={L("切換配色與字體", "Change colours and fonts")}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="8.5" cy="9.5" r="1.6" fill="var(--a)" />
          <circle cx="15.5" cy="9.5" r="1.6" fill="var(--b)" />
          <circle cx="12" cy="15.5" r="1.8" fill="var(--mid)" />
        </svg>
        {L("風格", "Style")}
      </button>
    </div>
  );
}
