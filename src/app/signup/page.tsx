import { redirect } from "next/navigation";
import { Suspense } from "react";
import AuthForm from "@/components/site/AuthForm";
import { currentUser } from "@/lib/server/auth";
import { getT } from "@/lib/server/locale";

export async function generateMetadata() {
  const { L } = await getT();
  return { title: L("註冊｜中途租 Midway", "Sign up · Midway") };
}

export default async function Page() {
  if (await currentUser().catch(() => null)) redirect("/me");
  return (
    <main className="auth-page">
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </main>
  );
}
