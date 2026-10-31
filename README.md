# Midway 中途租（正式專案版）

兩個人工作地不同時，反向推薦「對雙方都說得過去」的居住地點，再為區域內的房源評分。

- **前端與後端**：Next.js 16（App Router，React 19，TypeScript）
- **資料庫**：PostgreSQL ＋ Drizzle ORM
- **地圖與通勤**：Google Maps Platform（Maps JavaScript、Routes、Places API (New)）
- **AI 說明**：Claude API（選用）
- **登入系統**：Better Auth（Email + 密碼，密碼以 scrypt 雜湊儲存）

**線上版本：** （部署後填入網址，例如 `https://midway.vercel.app`）

> 沒有任何 API 金鑰也能完整執行：通勤時間改用估算模型，地圖改用開源的 OpenStreetMap 底圖，AI 說明改用規則模板。

---

## 1. 本機執行

### 需要先安裝

- [Node.js](https://nodejs.org/) 20.9 以上（建議 LTS 版）
- 資料庫，二選一：
  - **A. Docker Desktop**：在本機跑 PostgreSQL
  - **B. 不想裝 Docker**：到 [Neon](https://neon.tech) 或 [Supabase](https://supabase.com) 開一個免費的 PostgreSQL，複製連線字串

### 步驟

```bash
# 1) 安裝套件
npm install

# 2) 建立環境變數檔
#    Windows（命令提示字元）：copy .env.example .env
#    macOS / Linux：         cp .env.example .env
#    然後打開 .env 確認 DATABASE_URL（用 Neon/Supabase 就貼上它們的連線字串）

# 3) 啟動資料庫（選 A 才需要）
docker compose up -d

# 4) 建立資料表並匯入模擬資料
npm run setup

# 5) 啟動開發伺服器
npm run dev
```

打開 http://localhost:3000 ，按「帶入範例」→「找出我們的中間點」。

檢查設定是否正確：http://localhost:3000/api/health 會顯示資料庫、Google、AI 是否啟用。

### 常用指令

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 開發模式（改程式碼會自動更新） |
| `npm run build` / `npm start` | 正式建置與啟動 |
| `npm run db:push` | 把 `src/db/schema.ts` 的資料表結構同步到資料庫 |
| `npm run db:seed` | 重新匯入模擬資料（不會刪除使用者的搜尋紀錄） |
| `npm run db:studio` | 開啟網頁版資料庫瀏覽器 |
| `npm run typecheck` | TypeScript 型別檢查 |
| `npm run check:keys` | 逐一測試 `.env` 裡的資料庫與 API 金鑰是否可用 |

---

## 2. API 金鑰：申請、填入、測試

所有金鑰都放在**環境變數**：本機是專案根目錄的 `.env`，部署後是 Vercel 的 Environment Variables。**`.env` 已列在 `.gitignore`，絕對不要上傳到 GitHub；`.env.example` 會上傳，裡面只能放空白或範例值。**

| 變數 | 用途 | 必填？ | 會被瀏覽器看到嗎 | 沒填會怎樣 |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | 資料庫連線（Neon） | 必填 | 否 | 無法啟動 |
| `BETTER_AUTH_SECRET` | 登入系統簽署 session 的密鑰 | 部署必填 | 否 | `npm run dev` 用內建開發金鑰；`npm start` 與正式網站登入會停用 |
| `BETTER_AUTH_URL` | 網站網址 | 建議 | 否 | 本機預設 `http://localhost:3000`；Vercel 上自動用正式網域 |
| `GOOGLE_MAPS_SERVER_KEY` | Routes API（通勤時間）、Places API (New)（地址搜尋） | 選填 | **否**，只在後端 | 工作地只能選常見地點，通勤用估算 |
| `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` | Maps JavaScript API（Google 地圖） | 選填 | **是** | 改用 OpenStreetMap 地圖 |
| `NEXT_PUBLIC_GOOGLE_MAP_ID` | 地圖 ID（自訂標記需要） | 選填 | 是 | 用 `DEMO_MAP_ID` |
| `ANTHROPIC_API_KEY` | AI 取捨說明、AI 顧問對話 | 選填 | 否 | 規則模板，對話停用 |
| `ANTHROPIC_MODEL` | Claude 模型 | 選填 | 否 | `claude-haiku-5-5` |

### 填完之後怎麼測試

```bash
npm run check:keys
```

會對每個服務送一個最小的測試請求，逐項顯示 ✅／❌，失敗時會說明原因（API 沒啟用、金鑰限制勾錯、沒有額度……）。接著重新啟動 `npm run dev`，打開 `http://localhost:3000/api/health`：

```json
{ "database": "ok", "googleServer": true, "googleMap": true, "llm": true }
```

三個 `true` 分別代表 Google 後端、Google 地圖、Claude 已啟用。畫面上的變化：

| 金鑰 | 畫面上的確認方式 |
| --- | --- |
| 伺服器金鑰 | 搜尋頁的工作地變成可以輸入任何地址；結果頁左側「通勤資料」顯示「Google 尖峰時段」 |
| 瀏覽器金鑰 | 結果頁的地圖變成 Google 地圖（如果是灰色並寫「無法正確載入 Google 地圖」，看瀏覽器 Console 的錯誤碼） |
| Claude | 地區卡片出現「用 AI 說明」按鈕；「AI 顧問」分頁可以輸入問題 |

> 修改 `NEXT_PUBLIC_` 開頭的變數後，一定要重新啟動 `npm run dev`（部署則要 Redeploy），因為它們是在建置時寫進網頁的。

---

### A. 登入密鑰 `BETTER_AUTH_SECRET`（免申請，自己產生）

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

把輸出貼到 `.env` 的 `BETTER_AUTH_SECRET=`。本機和 Vercel **要用不同的兩組**。這串字等同網站的印章：外洩的話任何人都能偽造登入，必須換一組新的（換掉後所有人需要重新登入）。

---

### B. Google Maps Platform（三個 API、兩把金鑰）

**費用**：Google 已改成「每個項目每月各有免費次數」（不再是每月 200 美元額度）。本專案用到的項目與免費次數：

| 功能 | 計費項目 | 每月免費 | 超過後每 1,000 次 |
| --- | --- | --- | --- |
| 顯示地圖 | Dynamic Maps | 10,000 次載入 | US$7 |
| 大眾運輸通勤時間 | Compute Route Matrix Essentials | 10,000 個 element | US$5 |
| 開車（尖峰路況） | Compute Route Matrix Pro | 5,000 個 element | US$10 |
| 機車 | Compute Route Matrix Enterprise（兩輪路線） | 較少 | 較貴 |
| 地址自動完成 | Autocomplete Requests | 10,000 次 | US$2.83 |
| 選定地址取座標 | Place Details Essentials | 10,000 次 | US$5 |

**一次搜尋大約用掉**：33 個地區 × 2 人 = 66 個 element；打開一個地區看房源再多 40 個。同一個工作地 30 天內會用快取，不會重複計費。課堂展示用量遠低於免費額度，但仍要設定下面的**用量上限**，避免金鑰外洩被盜刷。

**步驟：**

1. 到 [Google Cloud Console](https://console.cloud.google.com/) → 左上角選單「建立專案」（例如 `midway`）。
2. **綁定帳單**：「帳單」→ 連結帳單帳戶（需要信用卡；在免費額度內不會扣款）。到「帳單 → 預算與快訊」建立 US$1 的預算警示，超過時會寄信給你。
3. **啟用 API**：「API 和服務 → 程式庫」，分別搜尋並啟用：
   - **Routes API**
   - **Places API (New)**（注意是 New，不是舊版 Places API）
   - **Maps JavaScript API**
4. **建立伺服器金鑰**：「API 和服務 → 憑證 → 建立憑證 → API 金鑰」
   - 名稱：`midway-server`
   - 應用程式限制：**無**（Vercel 的伺服器 IP 不固定，所以不設；它不會出現在網頁上）
   - API 限制：**限制金鑰** → 只勾 `Routes API`、`Places API (New)`
   - 填入 `.env` 的 `GOOGLE_MAPS_SERVER_KEY`
5. **建立瀏覽器金鑰**：同樣建立一把
   - 名稱：`midway-browser`
   - 應用程式限制：**網站** → 加入 `http://localhost:3000/*` 和 `https://你的網址.vercel.app/*`
   - API 限制：只勾 `Maps JavaScript API`
   - 填入 `.env` 的 `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`
6. **設定每日用量上限（建議）**：「API 和服務 → 已啟用的 API」→ 點 Routes API → 「配額與系統限制」→ 把每日 element 數改小（例如每天 2,000）。Places API (New) 同樣設定。
7. （選用）**地圖 ID**：「Google Maps Platform → 地圖管理 → 建立地圖 ID」，類型選 JavaScript、向量，填入 `NEXT_PUBLIC_GOOGLE_MAP_ID`。不填會用 `DEMO_MAP_ID`，開發時沒問題。
8. 執行 `npm run check:keys`，Routes API 與 Places API 應該都是 ✅。剛啟用的 API 可能要等幾分鐘才生效。

**常見錯誤**

| 訊息 | 原因 |
| --- | --- |
| `SERVICE_DISABLED` / has not been used | API 沒啟用，或剛啟用還沒生效 |
| `API_KEY_SERVICE_BLOCKED` | 金鑰的「API 限制」沒勾到這個 API |
| `BILLING_NOT_ENABLED` | 專案沒有綁定帳單 |
| 地圖顯示 `RefererNotAllowedMapError` | 瀏覽器金鑰的網站限制沒有加入目前的網址 |
| 地圖顯示 `ApiNotActivatedMapError` | Maps JavaScript API 沒啟用 |

---

### C. Claude API（AI 說明與 AI 顧問）

1. 到 [Claude Console](https://console.anthropic.com/) 註冊並登入。
2. **Billing**：儲值（API 是預付制，最低金額依頁面顯示）。在 **Limits** 設定每月花費上限，例如 US$5。
3. **API Keys → Create Key**，名稱 `midway`，複製 `sk-ant-...` 開頭的字串（只會顯示一次）。
4. 填入 `.env` 的 `ANTHROPIC_API_KEY`，`ANTHROPIC_MODEL` 保持 `claude-haiku-5-5`。
5. 執行 `npm run check:keys`，應該看到模型回覆「OK」。

**費用**：Claude Haiku 5.5 每百萬 token 輸入 US$0.10、輸出 US$0.50（單次提示在 10 萬 token 以內）。一次 AI 說明或對話約 3,000～8,000 token，等於不到 0.1 元台幣。

---

### D. 部署到 Vercel 時

到 Vercel 專案的 **Settings → Environment Variables**，把上面用到的變數逐一加入（`BETTER_AUTH_SECRET` 用另一組新的），再到 **Deployments → Redeploy**。別忘了把正式網址加進 Google 瀏覽器金鑰的網站限制。

程式中讀取金鑰的位置：`src/lib/server/google.ts`（Google 後端）、`src/lib/server/llm.ts`（Claude）、`src/lib/server/auth.ts`（登入）、`src/lib/server/features.ts`（決定哪些功能啟用，並把瀏覽器金鑰傳給前端）。

---

## 3. 專案結構

```
src/
├─ app/                         # Next.js 頁面與 API（App Router）
│  ├─ page.tsx                  # 首頁：產品介紹
│  ├─ search/page.tsx           # 開始搜尋：輸入表單
│  ├─ login/ , signup/          # 登入、註冊
│  ├─ me/page.tsx               # 我的搜尋（需登入）
│  ├─ s/[id]/page.tsx           # 結果頁（這個網址就是分享連結）
│  └─ api/                      # 後端 API
│     ├─ searches/                          POST 建立搜尋
│     ├─ searches/[id]/                     GET 讀取、PATCH 更新權重
│     ├─ searches/[id]/votes/               GET / POST 投票
│     ├─ searches/[id]/explain/             POST AI 取捨說明
│     ├─ searches/[id]/chat/                POST AI 顧問對話（空訊息時回傳重點整理）
│     ├─ searches/[id]/listings/            GET 跨區房源排行
│     ├─ searches/[id]/areas/[pointId]/listings/  GET 區域內房源（第二階段推薦）
│     ├─ places/autocomplete/ , places/details/  Google 地址搜尋（後端代理）
│     ├─ auth/[...all]/                     Better Auth（註冊、登入、登出）
│     ├─ workplaces/                        GET 常見工作地
│     └─ health/                            GET 設定檢查
├─ components/                  # 前端元件
│  ├─ SearchForm.tsx, WorkplacePicker.tsx
│  ├─ ResultsView.tsx           # 結果頁主體（權重、投票、分頁）
│  ├─ results/                  # 方案卡、比較表、演算法說明、房源抽屜
│  └─ map/                      # GoogleMap（有金鑰）／LeafletMap（備援）
├─ db/
│  ├─ schema.ts                 # 資料表定義
│  ├─ seed.ts, seed-data.ts     # 模擬資料
│  └─ index.ts                  # 資料庫連線
└─ lib/
   ├─ scoring.ts                # 評分公式、挑選方案、模板說明（前後端共用）
   ├─ estimate.ts               # 估算模式的通勤模型
   ├─ constants.ts, types.ts
   └─ server/                   # 只在後端執行
      ├─ google.ts              # Routes API、Places API
      ├─ commute.ts             # 通勤：快取 → Google → 估算
      ├─ searches.ts            # 建立搜尋、投票、房源評分
      ├─ llm.ts                 # Claude API
      └─ features.ts
```

### 資料表

| 資料表 | 內容 |
| --- | --- |
| `candidate_points` | 候選居住地點（33 個，雙北桃園） |
| `rent_stats` | 地點 × 房型的租金行情（模擬） |
| `amenity_scores` | 地點 × 生活機能分數（模擬） |
| `workplace_presets` | 常見工作地 |
| `commute_cache` | Google 通勤查詢快取（30 天；目的地以約 500m 網格共用） |
| `listings` | 房源（模擬，每個地點每種房型 20 筆，含屋齡、電梯；價格依坪數、屋齡、到站距離浮動） |
| `searches` | 每次搜尋的條件、權重、計算結果快照 |
| `votes` | 雙人投票 |
| `user`、`session`、`account`、`verification` | 登入系統（Better Auth）；`searches.user_id` 連到建立者 |

### 推薦邏輯重點

- **地區不看平均房價**：一個地區是否推薦，看的是「預算內（含預算彈性）找不找得到房子」，至少 2 間才推薦。所以行情偏高的地區（例如南港），只要還有便宜的房子就會出現，卡片會標示「行情偏高」。
- **成本分數用「可租價格」**：預算內房源的租金中位數，也就是你們實際會租到的價格，而不是整區平均。
- **預算彈性**：可選擇接受略超預算 1,000～3,000 元，這些房源會以橘色「略超預算」標示。
- **房源取捨**：便宜的房子會標出可能的代價，例如屋齡 30 年以上、離站步行 12 分以上、坪數較小、無電梯 4 樓以上。
- **房源排行**：所有兩人通勤都在上限內、租金在可接受範圍內的房源，跨區一起排名。
- **AI 顧問**：開場會依目前條件整理重點；設定 `ANTHROPIC_API_KEY` 後可以直接提問，例如「為什麼南港沒被推薦？」。

### 運作流程

1. **建立搜尋**：後端讀取所有候選地點，呼叫 Google Routes API（每人一次 Route Matrix）取得尖峰通勤時間，加上租金與生活機能，存成 `searches.metrics` 快照。
2. **結果頁**：前端用同一份 `scoring.ts` 即時依權重計分；權重變更會存回資料庫，投票每 5 秒同步。
3. **區域房源**：點「看這區房源」時，後端對該區每筆房源逐一查詢兩人的通勤時間，並用同一個公式重新評分。

---

## 4. 模擬資料與目前限制

- 租金行情、生活機能分數、房源皆為模擬資料（`src/db/seed-data.ts`、`src/db/seed.ts`）。
- Google Route Matrix 不回傳搭乘路線，大眾運輸交通費以都會通月票（1,200 元）估算。
- 正式版可替換：租金 → 內政部實價登錄租賃資料；生活機能 → Google Places 周邊統計；房源 → 與租屋平台合作或房東刊登。

---

## 5. 視覺設計與多語系

設計概念是「通勤路線圖」：兩個人是兩條路線，推薦的中間點是兩線交會的車站。首頁主視覺與行動區使用該配色最深的顏色，內容區使用淺色，形成深淺節奏。

- **風格切換**：每頁右下角的「風格」按鈕可切換 7 組配色與 8 組中英文字體，選擇存在 cookie。配色與字體定義在 `src/lib/themes.ts`，所有元件只使用 `src/app/globals.css` 開頭 `:root` 的 CSS 變數，因此新增一組配色只要在 `THEMES` 加一筆。
- **中英文切換**：導覽列的「中／EN」。介面文字寫在元件裡（`L("中文", "English")`），地名、工作地、房源標題在 `src/lib/constants.ts` 轉換；伺服器產生的文字（評分理由、AI 說明）依 cookie 決定語言。
- **動畫**：首頁路線圖會輪播三組情境，捲動時各區塊依序出現；系統開啟「減少動態」時全部改為靜態。

---

## 6. 部署（Vercel + Neon）

| 元件 | 平台 | 說明 |
| --- | --- | --- |
| 網站（前端＋後端 API） | [Vercel](https://vercel.com) | Next.js 官方平台，連結 GitHub 後每次 push 自動部署 |
| 資料庫 | [Neon](https://neon.tech) | 雲端 PostgreSQL；本機開發與正式網站可共用同一個資料庫 |

### 第一次部署

1. **本機先確認能建置**：`npm run build` 沒有錯誤。
2. **推到 GitHub**：確認 `.env` 沒有被加入（`git status` 裡不應該出現 `.env`）。
3. **Vercel → Add New → Project → Import** 這個 GitHub repo。Framework 會自動辨識為 Next.js；如果 repo 根目錄不是 `midway-app`，要把 **Root Directory** 設成 `midway-app`。
4. **設定 Environment Variables**（Production）：

   | 變數 | 值 |
   | --- | --- |
   | `DATABASE_URL` | Neon 的連線字串（建議用含 `-pooler` 的版本） |
   | `BETTER_AUTH_SECRET` | 隨機字串：`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
   | `BETTER_AUTH_URL` | 正式網址，例如 `https://midway.vercel.app`（沒填時會自動使用 Vercel 的正式網域） |

5. **Deploy**，完成後打開 `https://你的網址/api/health`，應該看到 `"database":"ok"`。
6. 實際註冊一個帳號、建立一次搜尋，確認流程正常。

資料表與模擬資料是用本機的 `npm run setup` 建立在 Neon 上，Vercel 部署時不會自動執行。之後修改 `schema.ts` 時，要在本機執行 `npm run db:push` 同步到資料庫。

### 之後加入金鑰

在 Vercel 的 **Settings → Environment Variables** 新增變數，然後到 **Deployments** 對最新版本按 **Redeploy**。`NEXT_PUBLIC_` 開頭的變數一定要重新部署才會生效。

- Google 地圖瀏覽器金鑰：記得把正式網址加進金鑰的「HTTP 參照網址」限制。
- 部署後的網址改變時，也要更新 `BETTER_AUTH_URL`。

---

## 7. AI 工具使用說明（課程要求）

本專案在以下環節使用 AI 輔助，並由組員檢查與修正：

| 環節 | AI 協助的內容 | 我們的判斷與修改 |
| --- | --- | --- |
| 競品研究 | 搜尋國內外租屋平台的多人通勤功能 | （填寫：例如確認台灣主流平台都沒有此功能） |
| 商業模式 | 撰寫 VPC、BMC 草稿 | （填寫） |
| 演算法 | 提出加權評分公式 | 發現「只看平均房價會排除行情偏高的地區」，改成看預算內的房源數量 |
| 程式與設計 | 產生原型與正式專案程式碼、視覺設計 | （填寫） |
