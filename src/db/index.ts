import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// 開發模式下熱重載會重複載入模組，用 globalThis 保留同一個連線池
const g = globalThis as unknown as { __midwayPool?: Pool };

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 未設定，請參考 .env.example");
  // Neon 的憑證是公開 CA 簽發，直接用最嚴格的 verify-full（也消除 pg 的 SSL 警告）
  let connectionString = url;
  if (/neon\.tech/.test(url)) connectionString = url.replace(/sslmode=(prefer|require|verify-ca)/, "sslmode=verify-full");
  // Supabase 使用自己的 CA，網址沒帶 sslmode 時以加密但不驗證憑證的方式連線；本機 Docker 不用 SSL
  const ssl = /sslmode=/.test(connectionString) ? undefined : /supabase\.(co|com)/.test(url) ? { rejectUnauthorized: false } : undefined;
  return new Pool({ connectionString, max: 5, ssl });
}

export const pool = g.__midwayPool ?? createPool();
if (process.env.NODE_ENV !== "production") g.__midwayPool = pool;

export const db = drizzle(pool, { schema });
export { schema };
