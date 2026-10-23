import Link from "next/link";
import { redirect } from "next/navigation";
import { AMENITIES, ROOM_TYPES } from "@/lib/constants";
import { currentUser } from "@/lib/server/auth";
import { listMySearches } from "@/lib/server/searches";

export const metadata = { title: "我的搜尋｜中途租 Midway" };
export const dynamic = "force-dynamic";

export default async function MyPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/me");
  const items = await listMySearches(user.id);

  return (
    <main className="page-narrow">
      <h1>我的搜尋</h1>
      <p className="hint">你登入後建立的搜尋都在這裡。點進去可以繼續調整權重、投票或看房源。</p>
      {items.length === 0 ? (
        <div className="empty" style={{ marginTop: 24 }}>
          <h3>還沒有搜尋紀錄</h3>
          <p>輸入兩個人的工作地，第一次搜尋就會出現在這裡。</p>
          <Link href="/search" className="yellow-btn">
            開始找中間點
          </Link>
        </div>
      ) : (
        <ul className="my-list">
          {items.map((s) => {
            const [A, B] = s.input.people;
            const room = ROOM_TYPES.find((r) => r.id === s.input.room)?.name;
            const prefs = s.input.prefs.map((p) => AMENITIES.find((a) => a.id === p)?.name).filter(Boolean);
            return (
              <li key={s.id}>
                <Link href={`/s/${s.id}`}>
                  <span className="my-route">
                    <i style={{ background: "var(--a)" }} />
                    {A.name}在{A.workplace.label}
                    <i style={{ background: "var(--b)" }} />
                    {B.name}在{B.workplace.label}
                  </span>
                  <span className="my-meta">
                    {room}，預算 {s.input.budget.toLocaleString()} 元{s.budgetFlex ? `（可多 ${s.budgetFlex.toLocaleString()}）` : ""}
                    {prefs.length ? `，在意${prefs.join("、")}` : ""}
                  </span>
                  <span className="my-date">{new Date(s.createdAt).toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" })}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
