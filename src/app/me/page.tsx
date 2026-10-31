import Link from "next/link";
import { redirect } from "next/navigation";
import { AMENITIES, ROOM_TYPES, workplaceName } from "@/lib/constants";
import { currentUser } from "@/lib/server/auth";
import { getT } from "@/lib/server/locale";
import { listMySearches } from "@/lib/server/searches";

export async function generateMetadata() {
  const { L } = await getT();
  return { title: L("我的搜尋｜中途租 Midway", "My searches · Midway") };
}
export const dynamic = "force-dynamic";

export default async function MyPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/me");
  const [items, { L, locale }] = await Promise.all([listMySearches(user.id), getT()]);

  return (
    <main className="page-narrow">
      <h1>{L("我的搜尋", "My searches")}</h1>
      <p className="hint">{L("你登入後建立的搜尋都在這裡。點進去可以繼續調整權重、投票或看房源。", "Everything you've searched while logged in. Open one to keep tuning, voting or browsing homes.")}</p>
      {items.length === 0 ? (
        <div className="empty" style={{ marginTop: 24 }}>
          <h3>{L("還沒有搜尋紀錄", "No searches yet")}</h3>
          <p>{L("輸入兩個人的工作地，第一次搜尋就會出現在這裡。", "Enter two workplaces and your first search will show up here.")}</p>
          <Link href="/search" className="sun-btn">
            {L("開始找中間點", "Find our midpoint")}
          </Link>
        </div>
      ) : (
        <ul className="my-list">
          {items.map((s) => {
            const [A, B] = s.input.people;
            const room = ROOM_TYPES.find((r) => r.id === s.input.room)?.[locale];
            const prefs = s.input.prefs.map((p) => AMENITIES.find((a) => a.id === p)?.[locale]).filter(Boolean);
            const budget = s.input.budget.toLocaleString();
            const flex = s.budgetFlex ? s.budgetFlex.toLocaleString() : "";
            return (
              <li key={s.id}>
                <Link href={`/s/${s.id}`}>
                  <span className="my-route">
                    <i style={{ background: "var(--a)" }} />
                    {L(`${A.name}在${A.workplace.label}`, `${A.name} at ${workplaceName(A.workplace, locale)}`)}
                    <i style={{ background: "var(--b)" }} />
                    {L(`${B.name}在${B.workplace.label}`, `${B.name} at ${workplaceName(B.workplace, locale)}`)}
                  </span>
                  <span className="my-meta">
                    {L(`${room}，預算 ${budget} 元${flex ? `（可多 ${flex}）` : ""}`, `${room}, budget NT$${budget}${flex ? ` (+${flex} flex)` : ""}`)}
                    {prefs.length ? L(`，在意${prefs.join("、")}`, `, cares about ${prefs.join(", ").toLowerCase()}`) : ""}
                  </span>
                  <span className="my-date">{new Date(s.createdAt).toLocaleDateString(locale === "en" ? "en-GB" : "zh-TW", { timeZone: "Asia/Taipei" })}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
