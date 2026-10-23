import { redirect } from "next/navigation";
import { Suspense } from "react";
import AuthForm from "@/components/site/AuthForm";
import { currentUser } from "@/lib/server/auth";

export const metadata = { title: "登入｜中途租 Midway" };

export default async function Page() {
  if (await currentUser().catch(() => null)) redirect("/me");
  return (
    <main className="auth-page">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
