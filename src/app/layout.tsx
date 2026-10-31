import type { Metadata } from "next";
import { cookies } from "next/headers";
import Header from "@/components/site/Header";
import { LocaleProvider } from "@/components/site/LocaleProvider";
import StyleSwitcher from "@/components/site/StyleSwitcher";
import { getLocale } from "@/lib/server/locale";
import { FONT_COOKIE, FONTS, THEME_COOKIE, findFont, findTheme, themeCss } from "@/lib/themes";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const en = (await getLocale()) === "en";
  return en
    ? { title: "Midway — find a home between two commutes", description: "Enter two workplaces and a shared budget. Midway works backwards to the neighbourhoods that are fair to both of you." }
    : { title: "中途租 Midway｜兩個人的租屋中間點", description: "輸入兩個人的工作地與條件，反向推薦對雙方都說得過去的居住地點。" };
}

const PREVIEW_CSS = FONTS.map((f) => `[data-font-preview="${f.id}"]{font-family:${f.vars["--display"] ?? '"Fraunces", "Noto Serif TC", serif'}}`).join("");

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, jar] = await Promise.all([getLocale(), cookies()]);
  const theme = findTheme(jar.get(THEME_COOKIE)?.value);
  const font = findFont(jar.get(FONT_COOKIE)?.value);
  return (
    <html lang={locale === "en" ? "en" : "zh-Hant"} data-theme={theme.id} data-font={font.id}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href={font.href} rel="stylesheet" data-font-id={font.id} />
        <style dangerouslySetInnerHTML={{ __html: themeCss() + PREVIEW_CSS }} />
      </head>
      <body>
        <LocaleProvider locale={locale}>
          <Header />
          {children}
          <StyleSwitcher theme={theme.id} font={font.id} />
        </LocaleProvider>
      </body>
    </html>
  );
}
