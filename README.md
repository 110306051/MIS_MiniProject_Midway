# Midway 中途租（正式專案版）

兩個人工作地不同時，反向推薦「對雙方都說得過去」的居住地點，再為區域內的房源評分。

- **前端與後端**：Next.js 16（App Router，React 19，TypeScript）
- **資料庫**：PostgreSQL ＋ Drizzle ORM
- **地圖與通勤**：Google Maps Platform（Maps JavaScript、Routes、Places API (New)）
- **AI 說明**：Claude API（選用）
- **登入系統**：Better Auth（Email + 密碼，密碼以 scrypt 雜湊儲存）

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

---

## 2. API 金鑰放在哪裡

所有金鑰都放在**環境變數**：本機是專案根目錄的 `.env`，部署後是雲端平台的 Environment Variables 設定頁。**`.env` 已列在 `.gitignore`，絕對不要上傳到 GitHub。**

| 變數 | 用途 | 會被瀏覽器看到嗎 | 沒填會怎樣 |
| --- | --- | --- | --- |
| `DATABASE_URL` | 資料庫連線 | 否 | 無法啟動（必填） |
| `GOOGLE_MAPS_SERVER_KEY` | Routes API（通勤時間）、Places API (New)（地址搜尋） | **否**，只在後端使用 | 工作地只能選常見地點，通勤改用估算 |
| `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` | Maps JavaScript API（顯示 Google 地圖） | **是**（`NEXT_PUBLIC_` 開頭的變數會打包進網頁） | 改用 OpenStreetMap 地圖 |
| `NEXT_PUBLIC_GOOGLE_MAP_ID` | Google 地圖樣式 ID（自訂標記需要） | 是 | 預設 `DEMO_MAP_ID`（僅供開發） |
| `ANTHROPIC_API_KEY` | AI 取捨說明 | 否 | 使用規則模板 |
| `ANTHROPIC_MODEL` | 使用的 Claude 模型 | 否 | 預設 `claude-haiku-5-5` |
| `BETTER_AUTH_SECRET` | 登入系統的加密金鑰（簽署 session） | 否 | 本機使用內建的開發用金鑰；**部署前一定要設定** |
| `BETTER_AUTH_URL` | 網站網址 | 否 | 預設 `http://localhost:3000`；部署後改成正式網址 |

程式中讀取金鑰的位置：

- `src/lib/server/google.ts`：`GOOGLE_MAPS_SERVER_KEY`
- `src/lib/server/llm.ts`：`ANTHROPIC_API_KEY`
- `src/lib/server/features.ts`：決定哪些功能啟用，並把瀏覽器金鑰傳給前端
- `src/components/map/GoogleMap.tsx`：使用瀏覽器金鑰顯示地圖

> 修改 `NEXT_PUBLIC_` 開頭的變數後，必須重新啟動 `npm run dev` 或重新部署，因為它們是在建置時寫進網頁的。

### 申請 Google Maps 金鑰

1. 到 [Google Cloud Console](https://console.cloud.google.com/) 建立專案，並綁定帳單帳戶（每個 API 每月有免費額度，課堂使用通常不會超過；建議設定**預算警示**）。
2. 在「API 和服務 → 程式庫」啟用：**Maps JavaScript API**、**Routes API**、**Places API (New)**。
3. 在「憑證」建立**兩把**金鑰：
   - **伺服器金鑰** → `GOOGLE_MAPS_SERVER_KEY`
     - API 限制：只勾 Routes API、Places API (New)
   - **瀏覽器金鑰** → `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`
     - 應用程式限制：網站（HTTP 參照網址），加入 `http://localhost:3000/*` 和部署後的網址，例如 `https://你的專案.vercel.app/*`
     - API 限制：只勾 Maps JavaScript API
4. （選用）在「Google Maps Platform → 地圖管理」建立 Map ID，填入 `NEXT_PUBLIC_GOOGLE_MAP_ID`。

### 申請 Claude API 金鑰（選用）

到 [Claude Console](https://console.anthropic.com/) 建立 API key，填入 `ANTHROPIC_API_KEY`。結果頁每張卡片會出現「用 AI 說明」按鈕。

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

## 5. 視覺設計

設計概念是「捷運路線圖」：兩個人是兩條路線，第一個人用機場捷運紫（`#8246AF`）、第二個人用板南線藍（`#0070BD`），推薦的中間點是環狀線黃色（`#F5C400`）的車站。

- 字型：Chiron Hei HK（依香港街道與車站招牌設計的黑體），數字為等寬排列。
- 推薦地區沿著一條路線排列，第 1 名是黃色車站。
- 首頁的路線圖動畫只播放一次；系統開啟「減少動態」時不播放。
- 所有顏色變數集中在 `src/app/globals.css` 開頭的 `:root`。
