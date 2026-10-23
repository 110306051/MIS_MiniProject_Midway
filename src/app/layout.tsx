import type { Metadata } from "next";
import Header from "@/components/site/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "中途租 Midway｜兩個人的租屋中間點",
  description: "輸入兩個人的工作地與條件，反向推薦對雙方都說得過去的居住地點。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Chiron+Hei+HK:wght@400;500;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
