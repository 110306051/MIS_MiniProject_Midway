/**
 * 資料庫結構（Drizzle ORM + PostgreSQL）
 * 修改後執行 `npm run db:push` 同步到資料庫。
 */
import {
  pgTable, text, integer, doublePrecision, boolean, timestamp, jsonb, primaryKey, uniqueIndex, serial, index,
} from "drizzle-orm/pg-core";

/** 候選居住地點（以軌道車站或生活圈為單位） */
export const candidatePoints = pgTable("candidate_points", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  /** 經過的軌道路線代碼，例如 ["BL","TRA"]；估算模式與說明文字使用 */
  lines: text("lines").array().notNull().default([]),
  active: boolean("active").notNull().default(true),
});

/** 各地點、各房型的租金行情（正式版來源：內政部實價登錄租賃資料） */
export const rentStats = pgTable(
  "rent_stats",
  {
    id: serial("id").primaryKey(),
    pointId: text("point_id").notNull().references(() => candidatePoints.id, { onDelete: "cascade" }),
    roomType: text("room_type").notNull(), // studio | 2r | 3r
    median: integer("median").notNull(),
    source: text("source").notNull().default("dummy"),
    period: text("period").notNull().default("2026Q3"),
  },
  (t) => [uniqueIndex("rent_point_room").on(t.pointId, t.roomType)]
);

/** 生活機能分數 0~1（正式版可由 Google Places / OSM POI 統計） */
export const amenityScores = pgTable(
  "amenity_scores",
  {
    pointId: text("point_id").notNull().references(() => candidatePoints.id, { onDelete: "cascade" }),
    category: text("category").notNull(), // shop | park | food | quiet | pet
    score: doublePrecision("score").notNull(),
  },
  (t) => [primaryKey({ columns: [t.pointId, t.category] })]
);

/** 常見工作地（沒有 Google 金鑰時的選單，也是快速選項） */
export const workplacePresets = pgTable("workplace_presets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  lines: text("lines").array().notNull().default([]),
});

/** 通勤時間快取：同一起點到同一個 500m 網格、同一交通方式只查一次 Google */
export const commuteCache = pgTable(
  "commute_cache",
  {
    id: serial("id").primaryKey(),
    originKey: text("origin_key").notNull(), // "pt:<pointId>" 或 "ls:<listingId>"
    destKey: text("dest_key").notNull(), // 目的地座標四捨五入到約 500m
    mode: text("mode").notNull(), // transit | scooter | car
    minutes: integer("minutes").notNull(),
    distanceM: integer("distance_m"),
    source: text("source").notNull(), // google
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("commute_unique").on(t.originKey, t.destKey, t.mode)]
);

/** 房源（目前為模擬資料；正式版來自合作平台或房東刊登） */
export const listings = pgTable(
  "listings",
  {
    id: text("id").primaryKey(),
    pointId: text("point_id").notNull().references(() => candidatePoints.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    address: text("address").notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    roomType: text("room_type").notNull(),
    rent: integer("rent").notNull(),
    ping: doublePrecision("ping").notNull(),
    floor: text("floor").notNull(),
    walkMin: integer("walk_min").notNull(),
    /** 屋齡（年） */
    age: integer("age").notNull().default(20),
    elevator: boolean("elevator").notNull().default(true),
    features: text("features").array().notNull().default([]),
    source: text("source").notNull().default("dummy"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("listings_point_room").on(t.pointId, t.roomType)]
);

/* ---------- 登入系統（Better Auth 需要的四張表） ---------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  /** 密碼雜湊（由 Better Auth 以 scrypt 產生，不會存明碼） */
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 一次搜尋（分享連結 /s/<id> 就是這筆資料） */
export const searches = pgTable("searches", {
  id: text("id").primaryKey(),
  /** 建立者（未登入時為空；分享連結不需要登入也能看） */
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  /** 使用者輸入：兩人工作地、通勤條件、房型、預算、偏好 */
  input: jsonb("input").notNull(),
  /** 權重與是否計入交通費（兩人都可調整，最後修改者為準） */
  weights: jsonb("weights").notNull(),
  includeCost: boolean("include_cost").notNull().default(true),
  /** 預算彈性：可接受略超預算的金額（元），這些房源會特別標註 */
  budgetFlex: integer("budget_flex").notNull().default(0),
  /** 建立搜尋時算好的原始數據快照（各地點通勤、租金、機能） */
  metrics: jsonb("metrics").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 雙人投票 */
export const votes = pgTable(
  "votes",
  {
    searchId: text("search_id").notNull().references(() => searches.id, { onDelete: "cascade" }),
    pointId: text("point_id").notNull(),
    person: integer("person").notNull(), // 0 或 1
    liked: boolean("liked").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.searchId, t.pointId, t.person] })]
);
