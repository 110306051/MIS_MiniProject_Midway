/**
 * 登入系統（Better Auth）：Email + 密碼。
 * 金鑰：BETTER_AUTH_SECRET（正式環境必填），BETTER_AUTH_URL（網站網址）。
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";

const DEV_SECRET = "midway-dev-only-secret-change-me-in-production-0000";
if (!process.env.BETTER_AUTH_SECRET && process.env.NODE_ENV === "production") {
  console.warn("[auth] 正式環境未設定 BETTER_AUTH_SECRET，登入功能不安全");
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || DEV_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
  }),
  emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
  session: { expiresIn: 60 * 60 * 24 * 30 }, // 30 天
  plugins: [nextCookies()],
});

/** 伺服器端取得目前登入的使用者（沒登入回傳 null） */
export async function currentUser() {
  const s = await auth.api.getSession({ headers: await headers() });
  return s?.user ?? null;
}
