import Link from "next/link";
import { currentUser } from "@/lib/server/auth";
import BrandMark from "./BrandMark";
import SignOutButton from "./SignOutButton";

export default async function Header() {
  const user = await currentUser().catch(() => null);
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="中途租 首頁">
        <BrandMark />
        <span className="brand-name">
          中途租<em>Midway</em>
        </span>
      </Link>
      <nav className="nav" aria-label="主選單">
        <Link href="/search" className="hide-sm">
          開始搜尋
        </Link>
        {user ? (
          <>
            <Link href="/me">我的搜尋</Link>
            <span className="nav-user hide-sm">{user.name}</span>
            <SignOutButton />
          </>
        ) : (
          <>
            <Link href="/login">登入</Link>
            <Link href="/signup" className="yellow-btn">
              註冊
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
