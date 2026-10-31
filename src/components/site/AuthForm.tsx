"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { Translate } from "@/lib/i18n";
import { useL } from "./LocaleProvider";

/** 把 Better Auth 的錯誤代碼轉成使用者看得懂的說明 */
function explain(L: Translate, code?: string, message?: string) {
  switch (code) {
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return L("這個 Email 已經註冊過，請直接登入。", "That email is already registered. Please log in.");
    case "INVALID_EMAIL_OR_PASSWORD":
      return L("Email 或密碼不正確。", "Wrong email or password.");
    case "PASSWORD_TOO_SHORT":
      return L("密碼至少要 8 個字元。", "Password needs at least 8 characters.");
    case "INVALID_EMAIL":
      return L("Email 格式不正確。", "That email doesn't look right.");
    default:
      return message || L("沒有成功，請稍後再試。", "Something went wrong. Please try again.");
  }
}

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { L } = useL();
  const params = useSearchParams();
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/search";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (signup && !name.trim()) return setError(L("請輸入你的稱呼。", "Please enter a name."));
    if (!email.includes("@")) return setError(L("請輸入有效的 Email。", "Please enter a valid email."));
    if (password.length < 8) return setError(L("密碼至少要 8 個字元。", "Password needs at least 8 characters."));
    setBusy(true);
    const res = signup
      ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
      : await authClient.signIn.email({ email: email.trim(), password });
    if (res.error) {
      setError(explain(L, res.error.code, res.error.message));
      setBusy(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="auth-card">
      <h1>{signup ? L("建立帳號", "Create an account") : L("登入", "Log in")}</h1>
      <p className="hint">{signup ? L("註冊後，你建立的搜尋都會保存在「我的搜尋」。", "Your searches will be kept under My searches.") : L("登入後可以看到你建立過的搜尋。", "Log in to see the searches you've made.")}</p>
      <form onSubmit={submit} noValidate>
        {signup && (
          <label>
            {L("稱呼", "Name")}
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="nickname" maxLength={30} placeholder={L("小明", "Alex")} />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
        </label>
        <label>
          {L("密碼", "Password")}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={signup ? "new-password" : "current-password"} placeholder={L("至少 8 個字元", "At least 8 characters")} />
        </label>
        <p className="form-error" role="alert">
          {error}
        </p>
        <button type="submit" className="primary-btn" disabled={busy}>
          {busy ? (signup ? L("建立中…", "Creating…") : L("登入中…", "Logging in…")) : signup ? L("建立帳號", "Create account") : L("登入", "Log in")}
        </button>
      </form>
      <p className="auth-switch">
        {signup ? (
          <>
            {L("已經有帳號了？", "Already have an account? ")}<Link href={`/login?next=${encodeURIComponent(next)}`}>{L("登入", "Log in")}</Link>
          </>
        ) : (
          <>
            {L("還沒有帳號？", "New here? ")}<Link href={`/signup?next=${encodeURIComponent(next)}`}>{L("建立帳號", "Create an account")}</Link>
          </>
        )}
      </p>
    </div>
  );
}
