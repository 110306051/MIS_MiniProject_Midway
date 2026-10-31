import Link from "next/link";
import { getT } from "@/lib/server/locale";

/** 找不到頁面（包含不存在的搜尋連結） */
export default async function NotFound() {
  const { L } = await getT();
  return (
    <main className="not-found">
      <h1>{L("找不到這個頁面", "Page not found")}</h1>
      <p className="hint">{L("連結可能打錯了，或這個搜尋已被刪除。", "The link may be mistyped, or the search was deleted.")}</p>
      <Link className="primary-btn" href="/search">
        {L("重新搜尋", "Start a new search")}
      </Link>
    </main>
  );
}
