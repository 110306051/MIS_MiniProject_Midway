/**
 * 金鑰檢查：npm run check:keys
 * 讀取 .env，對每個服務送出一個最小的測試請求，告訴你哪把金鑰可以用、哪裡設定錯了。
 * 每次執行大約花費：Routes 1 個 element、Places 1 次自動完成、Claude 約 30 個 token（都在免費額度內或趨近於 0）。
 */
import "dotenv/config";

type Result = { name: string; ok: boolean | null; detail: string };
const results: Result[] = [];
const add = (name: string, ok: boolean | null, detail: string) => results.push({ name, ok, detail });

async function checkDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) return add("DATABASE_URL", false, "沒有設定");
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url.replace("sslmode=require", "sslmode=verify-full") });
    const r = await pool.query("select count(*)::int as n from candidate_points");
    await pool.end();
    add("DATABASE_URL", true, `連線成功，候選地點 ${r.rows[0].n} 筆${r.rows[0].n ? "" : "（是空的，請執行 npm run setup）"}`);
  } catch (e) {
    add("DATABASE_URL", false, (e as Error).message);
  }
}

async function checkGoogleServer() {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) return add("GOOGLE_MAPS_SERVER_KEY", null, "未設定（網站會用估算模式）");
  // Routes API：青埔 → 信義，大眾運輸，1 個 element
  const routes = await fetch("https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "condition,duration" },
    body: JSON.stringify({
      origins: [{ waypoint: { location: { latLng: { latitude: 25.0129, longitude: 121.2149 } } } }],
      destinations: [{ waypoint: { location: { latLng: { latitude: 25.0411, longitude: 121.5654 } } } }],
      travelMode: "TRANSIT",
    }),
  });
  const rt = await routes.text();
  if (routes.ok) {
    const el = JSON.parse(rt)[0] ?? {};
    add("Routes API", true, el.duration ? `青埔→信義 大眾運輸約 ${Math.round(parseInt(el.duration) / 60)} 分鐘` : `有回應（${el.condition ?? "無路線"}）`);
  } else add("Routes API", false, explainGoogle(routes.status, rt));

  // Places API (New)：自動完成
  const places = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
    body: JSON.stringify({ input: "台北101", languageCode: "zh-TW", includedRegionCodes: ["tw"] }),
  });
  const pt = await places.text();
  if (places.ok) {
    const first = JSON.parse(pt).suggestions?.[0]?.placePrediction?.text?.text;
    add("Places API (New)", true, first ? `「台北101」第一筆建議：${first}` : "有回應但沒有建議");
  } else add("Places API (New)", false, explainGoogle(places.status, pt));
}

function explainGoogle(status: number, body: string) {
  if (body.includes("SERVICE_DISABLED") || body.includes("has not been used")) return `${status}：這個 API 還沒啟用，到 Google Cloud「API 程式庫」啟用後等幾分鐘`;
  if (body.includes("API_KEY_INVALID")) return `${status}：金鑰不正確（複製時是否多了空白？）`;
  if (body.includes("API_KEY_SERVICE_BLOCKED") || body.includes("blocked")) return `${status}：金鑰的「API 限制」沒有勾選這個 API`;
  if (body.includes("BILLING")) return `${status}：專案還沒有綁定帳單帳戶`;
  if (body.includes("referer") || body.includes("REFERRER")) return `${status}：這把金鑰設了「網站限制」，伺服器金鑰不能設網站限制`;
  return `${status}：${body.slice(0, 200)}`;
}

function checkBrowserKey() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
  if (!key) return add("NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY", null, "未設定（地圖會用 OpenStreetMap）");
  if (key === process.env.GOOGLE_MAPS_SERVER_KEY) return add("NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY", false, "和伺服器金鑰是同一把：瀏覽器金鑰會公開，請分開建立並加上網站限制");
  add("NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY", null, "已設定。這把有網站限制，只能在瀏覽器測試：打開結果頁，地圖應該變成 Google 地圖");
}

async function checkAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return add("ANTHROPIC_API_KEY", null, "未設定（AI 說明用規則模板，AI 對話停用）");
  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 20, messages: [{ role: "user", content: "回覆「OK」兩個字" }] }),
  });
  const t = await res.text();
  if (res.ok) add("ANTHROPIC_API_KEY", true, `模型 ${model} 回覆：${JSON.parse(t).content?.[0]?.text ?? ""}`);
  else if (res.status === 401) add("ANTHROPIC_API_KEY", false, "401：金鑰不正確");
  else if (t.includes("credit")) add("ANTHROPIC_API_KEY", false, `${res.status}：帳戶沒有額度，請到 Claude Console 的 Billing 儲值`);
  else if (res.status === 404) add("ANTHROPIC_API_KEY", false, `404：找不到模型 ${model}，請檢查 ANTHROPIC_MODEL`);
  else add("ANTHROPIC_API_KEY", false, `${res.status}：${t.slice(0, 200)}`);
}

function checkAuth() {
  const s = process.env.BETTER_AUTH_SECRET;
  if (!s) add("BETTER_AUTH_SECRET", null, "未設定：npm run dev 可以用，但 npm start 與正式網站的登入會停用");
  else if (s.length < 32) add("BETTER_AUTH_SECRET", false, "太短，請用 32 字以上的隨機字串");
  else add("BETTER_AUTH_SECRET", true, "已設定");
  add("BETTER_AUTH_URL", null, process.env.BETTER_AUTH_URL || "未設定（本機預設 http://localhost:3000）");
}

(async () => {
  await checkDatabase();
  await checkGoogleServer().catch((e) => add("Google", false, `連不到 Google 伺服器（網路或防火牆）：${(e as Error).message}`));
  checkBrowserKey();
  await checkAnthropic().catch((e) => add("ANTHROPIC_API_KEY", false, (e as Error).message));
  checkAuth();
  console.log("\n金鑰檢查結果\n");
  for (const r of results) console.log(`${r.ok === true ? "✅" : r.ok === false ? "❌" : "➖"} ${r.name.padEnd(36)} ${r.detail}`);
  console.log("\n✅ 可以用　❌ 有問題　➖ 未設定或需要在瀏覽器確認\n");
  process.exit(results.some((r) => r.ok === false) ? 1 : 0);
})();
