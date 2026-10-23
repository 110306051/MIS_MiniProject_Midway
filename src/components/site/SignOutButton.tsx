"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();
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
      登出
    </button>
  );
}
