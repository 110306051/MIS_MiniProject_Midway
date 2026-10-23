"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/** 把 Better Auth 的錯誤代碼轉成使用者看得懂的說明 */
function explain(code?: string, message?: string) {
  switch (code) {
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "這個 Email 已經註冊過，請直接登入。";
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Email 或密碼不正確。";
    case "PASSWORD_TOO_SHORT":
      return "密碼至少要 8 個字元。";
    case "INVALID_EMAIL":
      return "Email 格式不正確。";
    default:
      return message || "沒有成功，請稍後再試。";
  }
}

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
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
    if (signup && !name.trim()) return setError("請輸入你的稱呼。");
    if (!email.includes("@")) return setError("請輸入有效的 Email。");
    if (password.length < 8) return setError("密碼至少要 8 個字元。");
    setBusy(true);
    const res = signup
      ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
      : await authClient.signIn.email({ email: email.trim(), password });
    if (res.error) {
      setError(explain(res.error.code, res.error.message));
      setBusy(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="auth-card">
      <h1>{signup ? "建立帳號" : "登入"}</h1>
      <p className="hint">{signup ? "註冊後，你建立的搜尋都會保存在「我的搜尋」。" : "登入後可以看到你建立過的搜尋。"}</p>
      <form onSubmit={submit} noValidate>
        {signup && (
          <label>
            稱呼
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="nickname" maxLength={30} placeholder="小明" />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
        </label>
        <label>
          密碼
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={signup ? "new-password" : "current-password"} placeholder="至少 8 個字元" />
        </label>
        <p className="form-error" role="alert">
          {error}
        </p>
        <button type="submit" className="primary-btn" disabled={busy}>
          {busy ? (signup ? "建立中…" : "登入中…") : signup ? "建立帳號" : "登入"}
        </button>
      </form>
      <p className="auth-switch">
        {signup ? (
          <>
            已經有帳號了？<Link href={`/login?next=${encodeURIComponent(next)}`}>登入</Link>
          </>
        ) : (
          <>
            還沒有帳號？<Link href={`/signup?next=${encodeURIComponent(next)}`}>建立帳號</Link>
          </>
        )}
      </p>
    </div>
  );
}
