"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useL } from "./LocaleProvider";

export default function SignOutButton() {
  const router = useRouter();
  const { L } = useL();
  return (
    <button
      type="button"
      className="nav-link"
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      {L("登出", "Log out")}
    </button>
  );
}
