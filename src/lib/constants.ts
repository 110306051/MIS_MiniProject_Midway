/** 前後端共用的常數 */

export const LINES: Record<string, string> = {
  R: "淡水信義線",
  BL: "板南線",
  G: "松山新店線",
  O: "中和新蘆線",
  BR: "文湖線",
  Y: "環狀線",
  A: "機場捷運",
  TRA: "台鐵",
  HSR: "高鐵",
  DS: "淡海輕軌",
};

export const AMENITIES = [
  { id: "shop", name: "超市與商圈" },
  { id: "park", name: "公園綠地" },
  { id: "food", name: "餐廳與夜生活" },
  { id: "quiet", name: "安靜住宅區" },
  { id: "pet", name: "寵物友善" },
] as const;
export type AmenityId = (typeof AMENITIES)[number]["id"];

export const ROOM_TYPES = [
  { id: "studio", name: "套房" },
  { id: "2r", name: "兩房" },
  { id: "3r", name: "三房" },
] as const;
export type RoomType = (typeof ROOM_TYPES)[number]["id"];

export const MODES = [
  { id: "transit", name: "大眾運輸" },
  { id: "scooter", name: "機車" },
  { id: "car", name: "開車" },
] as const;
export type Mode = (typeof MODES)[number]["id"];

/** 基北北桃都會通月票 */
export const TPASS = 1200;
export const WEEKS_PER_MONTH = 4.3;

export const DEFAULT_WEIGHTS = { f: 4, s: 2, r: 2, p: 2 };

export const PRESETS = [
  { name: "均衡", w: { f: 4, s: 2, r: 2, p: 2 } },
  { name: "公平優先", w: { f: 8, s: 1, r: 1, p: 1 } },
  { name: "省時優先", w: { f: 1, s: 8, r: 1, p: 1 } },
  { name: "省錢優先", w: { f: 1, s: 1, r: 8, p: 1 } },
  { name: "生活優先", w: { f: 1, s: 1, r: 1, p: 8 } },
];

/** 一般坪數（判斷房源是否偏小） */
export const TYPICAL_PING: Record<RoomType, number> = { studio: 9, "2r": 22, "3r": 32 };

/** 預算內（含彈性）房源少於這個數量的地區不推薦 */
export const MIN_SUPPLY = 2;

/** 預算彈性選項（元） */
export const FLEX_OPTIONS = [0, 1000, 2000, 3000];
