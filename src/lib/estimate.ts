/**
 * 「估算模式」通勤模型：沒有 Google 金鑰，或 Google 查不到路線時使用。
 * 直線距離 × 繞行係數 × 每公里分鐘數，加上步行候車與轉乘時間。
 */
import { LINES, TPASS, WEEKS_PER_MONTH, type Mode } from "./constants";
import type { Commute } from "./types";

type Place = { lat: number; lng: number; lines?: string[] };

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 依交通方式與距離估算每月交通費 */
export function monthlyCost(mode: Mode, km: number, days: number) {
  const trips = 2 * days * WEEKS_PER_MONTH;
  if (mode === "car") return Math.round(km * trips * 3); // 油錢與耗損約每公里 3 元
  if (mode === "scooter") return Math.round(km * trips * 1);
  return TPASS;
}

export function estimateCommute(origin: Place, dest: Place, mode: Mode, days: number): Commute {
  const straight = haversineKm(origin, dest);
  const km = Math.max(0.5, straight * (mode === "transit" ? 1.2 : 1.3));
  if (mode === "car") return { min: Math.round(Math.max(8, 6 + km * 1.8)), cost: monthlyCost("car", km, days), via: "開車（尖峰估算）", source: "estimate", distanceM: Math.round(km * 1000) };
  if (mode === "scooter") return { min: Math.round(Math.max(6, 4 + km * 2.3)), cost: monthlyCost("scooter", km, days), via: "機車（估算）", source: "estimate", distanceM: Math.round(km * 1000) };

  const oLines = origin.lines ?? [];
  const dLines = dest.lines ?? [];
  const shared = oLines.filter((l) => dLines.includes(l) && l !== "HSR");
  let min: number;
  let via: string;
  if (shared.length) {
    min = 13 + km * 1.2;
    via = `${LINES[shared[0]] ?? shared[0]}直達`;
  } else {
    const bus = oLines.length === 0 || dLines.length === 0 ? 12 : 0;
    min = 13 + km * 1.25 + 10 + bus;
    via = bus ? "公車轉乘軌道" : "軌道轉乘";
  }
  let cost = TPASS;
  if (oLines.includes("HSR") && dLines.includes("HSR") && km > 8) {
    const hsr = 18 + km * 0.55;
    if (hsr < min - 5) {
      min = hsr;
      via = "高鐵";
      cost = Math.round(Math.max(40, km * 4.5) * 2 * days * WEEKS_PER_MONTH);
    }
  }
  return { min: Math.round(Math.max(10, min)), cost, via, source: "estimate", distanceM: Math.round(km * 1000) };
}

/** 從附近的已知地點推估一個地址可搭的軌道路線（1.2 公里內） */
export function inferLines(p: { lat: number; lng: number }, refs: { lat: number; lng: number; lines: string[] }[]) {
  const near = refs.filter((r) => haversineKm(p, r) <= 1.2);
  return [...new Set(near.flatMap((r) => r.lines))];
}
