import type { AmenityId, Mode, RoomType } from "./constants";

export type Workplace = {
  label: string;
  lat: number;
  lng: number;
  placeId?: string;
  presetId?: string;
  /** 已知的軌道路線（常見工作地有；Google 搜尋到的地址由系統推估） */
  lines?: string[];
};

export type Person = {
  name: string;
  workplace: Workplace;
  mode: Mode;
  days: number;
  max: number;
};

export type SearchInput = {
  people: [Person, Person];
  room: RoomType;
  budget: number;
  splitA: number;
  prefs: AmenityId[];
};

export type Weights = { f: number; s: number; r: number; p: number };

export type CommuteSource = "google" | "estimate";

export type Commute = {
  min: number;
  /** 每月交通費（元） */
  cost: number;
  /** 路線說明，例如「機場捷運直達」 */
  via: string;
  source: CommuteSource;
  distanceM?: number;
};

export type AreaMetric = {
  pointId: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  lines: string[];
  /** 舊版欄位：等同 market */
  rent: number;
  /** 該區該房型的租金行情（中位數） */
  market?: number;
  /** 該區該房型所有上架房源的租金（由小到大） */
  rents?: number[];
  /** 依 AMENITIES 順序的分數 0~1 */
  amen: number[];
  commute: [Commute, Commute];
};

export type Metrics = {
  areas: AreaMetric[];
  commuteSource: CommuteSource | "mixed";
  computedAt: string;
};

export type SearchRecord = {
  id: string;
  input: SearchInput;
  weights: Weights;
  includeCost: boolean;
  budgetFlex: number;
  metrics: Metrics;
  createdAt: string;
};

export type VoteMap = Record<string, [boolean, boolean]>;

export type Features = {
  /** 後端有 Google 金鑰：地址搜尋、真實通勤時間 */
  googleServer: boolean;
  /** 前端 Google 地圖金鑰 */
  mapsBrowserKey: string | null;
  mapId: string;
  /** 後端有 LLM 金鑰 */
  llm: boolean;
};

export type PriceStatus = "in" | "near" | "over";

export type ListingView = {
  id: string;
  pointId: string;
  areaName: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  rent: number;
  ping: number;
  floor: string;
  walkMin: number;
  age: number;
  elevator: boolean;
  features: string[];
  commute: [Commute, Commute];
  score: number;
  /** in：預算內；near：在預算彈性範圍內；over：超過 */
  priceStatus: PriceStatus;
  /** 超過預算的金額（in 時為 0） */
  overBy: number;
  /** 與該區行情相比（負數代表比較便宜） */
  vsMarketPct: number;
  /** 可能的取捨，例如「屋齡 38 年」「離站步行 15 分」 */
  tradeoffs: string[];
  overCommute: boolean;
};
