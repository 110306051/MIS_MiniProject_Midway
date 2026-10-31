/** 前後端共用的常數（中英文名稱並列） */

export type Locale = "zh" | "en";
export type Named = { zh: string; en: string };
export const nameOf = (x: Named, locale: Locale) => x[locale];

export const LINES: Record<string, Named> = {
  R: { zh: "淡水信義線", en: "Red Line" },
  BL: { zh: "板南線", en: "Blue Line" },
  G: { zh: "松山新店線", en: "Green Line" },
  O: { zh: "中和新蘆線", en: "Orange Line" },
  BR: { zh: "文湖線", en: "Brown Line" },
  Y: { zh: "環狀線", en: "Circular Line" },
  A: { zh: "機場捷運", en: "Airport MRT" },
  TRA: { zh: "台鐵", en: "TRA rail" },
  HSR: { zh: "高鐵", en: "High-speed rail" },
  DS: { zh: "淡海輕軌", en: "Danhai LRT" },
};

export const AMENITIES = [
  { id: "shop", zh: "超市與商圈", en: "Shops & groceries" },
  { id: "park", zh: "公園綠地", en: "Parks" },
  { id: "food", zh: "餐廳與夜生活", en: "Food & nightlife" },
  { id: "quiet", zh: "安靜住宅區", en: "Quiet streets" },
  { id: "pet", zh: "寵物友善", en: "Pet friendly" },
] as const;
export type AmenityId = (typeof AMENITIES)[number]["id"];

export const ROOM_TYPES = [
  { id: "studio", zh: "套房", en: "Studio" },
  { id: "2r", zh: "兩房", en: "2-bedroom" },
  { id: "3r", zh: "三房", en: "3-bedroom" },
] as const;
export type RoomType = (typeof ROOM_TYPES)[number]["id"];

export const MODES = [
  { id: "transit", zh: "大眾運輸", en: "Public transit" },
  { id: "scooter", zh: "機車", en: "Scooter" },
  { id: "car", zh: "開車", en: "Car" },
] as const;
export type Mode = (typeof MODES)[number]["id"];

/** 基北北桃都會通月票 */
export const TPASS = 1200;
export const WEEKS_PER_MONTH = 4.3;

export const DEFAULT_WEIGHTS = { f: 4, s: 2, r: 2, p: 2 };

export const PRESETS = [
  { zh: "均衡", en: "Balanced", w: { f: 4, s: 2, r: 2, p: 2 } },
  { zh: "公平優先", en: "Fairness", w: { f: 8, s: 1, r: 1, p: 1 } },
  { zh: "省時優先", en: "Less time", w: { f: 1, s: 8, r: 1, p: 1 } },
  { zh: "省錢優先", en: "Less money", w: { f: 1, s: 1, r: 8, p: 1 } },
  { zh: "生活優先", en: "Lifestyle", w: { f: 1, s: 1, r: 1, p: 8 } },
];

/** 一般坪數（判斷房源是否偏小） */
export const TYPICAL_PING: Record<RoomType, number> = { studio: 9, "2r": 22, "3r": 32 };

/** 預算內（含彈性）房源少於這個數量的地區不推薦 */
export const MIN_SUPPLY = 2;

/** 預算彈性選項（元） */
export const FLEX_OPTIONS = [0, 1000, 2000, 3000];

/* ---------- 地名的英文（資料庫存中文，顯示時依語系轉換） ---------- */

export const CITY_EN: Record<string, string> = { 台北市: "Taipei", 新北市: "New Taipei", 桃園市: "Taoyuan" };

export const AREA_EN: Record<string, string> = {
  zhongshan: "Zhongshan", daan: "Da'an", guting: "Guting", songshan: "Songshan", "xinyi-xs": "Xinyi (Xiangshan)",
  shilin: "Shilin", beitou: "Beitou", neihu: "Neihu", nangang: "Nangang", wanhua: "Wanhua", jingmei: "Jingmei",
  banqiao: "Banqiao", xinpu: "Xinpu", xinzhuang: "Xinzhuang", sanchong: "Sanchong", luzhou: "Luzhou",
  taishan: "Taishan (A4)", zhonghe: "Zhonghe", yonghe: "Yonghe", xindian: "Xindian", tucheng: "Tucheng",
  shulin: "Shulin", xizhi: "Xizhi", linkou: "Linkou", tamsui: "Tamsui", "guishan-a7": "Guishan (A7)",
  nankan: "Nankan", kengkou: "Kengkou (A11)", taoyuan: "Taoyuan District", qingpu: "Qingpu", zhongli: "Zhongli",
  neili: "Neili", bade: "Bade",
};

export const WORKPLACE_EN: Record<string, string> = {
  "tpe-main": "Taipei Main Station", xinyi: "Xinyi (City Hall)", "neihu-sci": "Neihu Science Park",
  "nangang-sw": "Nangang Software Park", "banqiao-st": "Banqiao Station", "xinzhuang-cbd": "Xinzhuang CBD",
  "linkou-cgmh": "Linkou Chang Gung Hospital", huaya: "Huaya Technology Park", airport: "Taoyuan Airport",
  "qingpu-hsr": "HSR Taoyuan (Qingpu)", "taoyuan-st": "Taoyuan Station", "zhongli-st": "Zhongli Station",
};

export const FEATURE_EN: Record<string, string> = {
  可養寵物: "Pets OK", 可開伙: "Kitchen", 有陽台: "Balcony", 近超市: "Near grocery", 含管理費: "Fees included",
  有車位: "Parking", 對外窗: "Window", 可入籍: "Can register address", 近公園: "Near park", 有電梯: "Elevator",
};

export const areaName = (pointId: string, zh: string, locale: Locale) => (locale === "en" ? AREA_EN[pointId] ?? zh : zh);
export const cityName = (zh: string, locale: Locale) => (locale === "en" ? CITY_EN[zh] ?? zh : zh);
export const workplaceName = (w: { label: string; presetId?: string }, locale: Locale) =>
  locale === "en" && w.presetId ? WORKPLACE_EN[w.presetId] ?? w.label : w.label;
export const featureName = (f: string, locale: Locale) => (locale === "en" ? FEATURE_EN[f] ?? f : f);

/** 通勤方式說明（資料庫存的是中文句子，例如「機場捷運直達」） */
export function viaName(via: string, locale: Locale) {
  if (locale === "zh") return via;
  const direct = Object.values(LINES).find((l) => via === `${l.zh}直達`);
  if (direct) return `${direct.en}, direct`;
  const map: Record<string, string> = {
    軌道轉乘: "Rail, 1 transfer", 公車轉乘軌道: "Bus + rail", 高鐵: "High-speed rail", 大眾運輸: "Public transit",
    "開車（尖峰估算）": "Car (rush hour)", "開車（尖峰）": "Car (rush hour)", "機車（估算）": "Scooter", 機車: "Scooter",
  };
  return map[via] ?? via;
}

/** 房源標題（資料庫存中文，例如「板橋仁愛路・公寓兩房」） */
export function listingTitle(title: string, pointId: string, locale: Locale) {
  if (locale === "zh") return title;
  const kinds: [string, string][] = [["新成屋社區", "New-build"], ["電梯大樓", "Elevator building"], ["華廈", "Mid-rise"], ["公寓", "Walk-up"]];
  const kind = kinds.find(([z]) => title.includes(z))?.[1] ?? "Home";
  const room = ROOM_TYPES.find((r) => title.endsWith(r.zh))?.en ?? "";
  return `${AREA_EN[pointId] ?? ""} · ${kind} ${room}`.trim();
}
