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

const isProd = process.env.NODE_ENV === "production";
const DEV_SECRET = "midway-dev-only-secret-change-me-in-production-0000";
if (!process.env.BETTER_AUTH_SECRET && isProd) {
  // 正式環境不使用公開的開發用金鑰（否則任何人都能偽造登入狀態），登入功能會停用直到設定為止
  console.error("[auth] 正式環境未設定 BETTER_AUTH_SECRET，登入功能停用");
}

/** 網站網址：優先用 BETTER_AUTH_URL，Vercel 上沒設定時用 Vercel 提供的正式網域 */
const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const baseURL = process.env.BETTER_AUTH_URL || (vercelProd ? `https://${vercelProd}` : "http://localhost:3000");
/** 允許的來源：正式網址＋這次部署的網址（Vercel 預覽網址也能登入） */
const trustedOrigins = [baseURL, process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`, vercelProd && `https://${vercelProd}`].filter(Boolean) as string[];

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || (isProd ? undefined : DEV_SECRET),
  baseURL,
  trustedOrigins,
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
