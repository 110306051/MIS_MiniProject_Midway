import Link from "next/link";
import { currentUser } from "@/lib/server/auth";
import { getT } from "@/lib/server/locale";
import BrandMark from "./BrandMark";
import LangToggle from "./LangToggle";
import SignOutButton from "./SignOutButton";

export default async function Header() {
  const [user, { L }] = await Promise.all([currentUser().catch(() => null), getT()]);
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label={L("中途租 首頁", "Midway home")}>
        <BrandMark />
        <span className="brand-name">
          Midway<em>中途租</em>
        </span>
      </Link>
      <nav className="nav" aria-label={L("主選單", "Main")}>
        <Link href="/search" className="hide-sm">
          {L("開始搜尋", "Search")}
        </Link>
        {user ? (
          <>
            <Link href="/me">{L("我的搜尋", "My searches")}</Link>
            <span className="nav-user hide-sm">{user.name}</span>
            <SignOutButton />
          </>
        ) : (
          <>
            <Link href="/login">{L("登入", "Log in")}</Link>
            <Link href="/signup" className="sun-btn">
              {L("註冊", "Sign up")}
            </Link>
          </>
        )}
        <LangToggle />
      </nav>
    </header>
  );
}
