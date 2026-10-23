/**
 * 通勤服務：快取 → Google Routes → 估算模型
 */
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { commuteCache } from "@/db/schema";
import { estimateCommute, monthlyCost } from "../estimate";
import { TPASS } from "../constants";
import type { Commute, Person } from "../types";
import { hasGoogleServer, routeMatrix } from "./google";

const CACHE_DAYS = 30;

export type Origin = { key: string; lat: number; lng: number; lines: string[] };

/** 目的地座標四捨五入到約 500 公尺，同一區的辦公室共用快取 */
export const destKeyOf = (lat: number, lng: number) => `${(Math.round(lat / 0.005) * 0.005).toFixed(3)},${(Math.round(lng / 0.005) * 0.005).toFixed(3)}`;

export async function getCommutes(origins: Origin[], person: Person): Promise<Commute[]> {
  const { workplace: dest, mode, days } = person;
  const estimate = (o: Origin) => estimateCommute(o, { ...dest, lines: dest.lines ?? [] }, mode, days);
  if (!hasGoogleServer() || origins.length === 0) return origins.map(estimate);

  const destKey = destKeyOf(dest.lat, dest.lng);
  const since = new Date(Date.now() - CACHE_DAYS * 86400000);
  const cached = await db
    .select()
    .from(commuteCache)
    .where(and(eq(commuteCache.destKey, destKey), eq(commuteCache.mode, mode), inArray(commuteCache.originKey, origins.map((o) => o.key)), gte(commuteCache.createdAt, since)));
  const hit = new Map(cached.map((c) => [c.originKey, c]));

  const missing = origins.filter((o) => !hit.has(o.key));
  if (missing.length) {
    try {
      const results = await routeMatrix(missing, dest, mode);
      const rows = missing
        .map((o, i) => (results[i] ? { originKey: o.key, destKey, mode, minutes: results[i]!.minutes, distanceM: results[i]!.distanceM, source: "google" } : null))
        .filter((r): r is NonNullable<typeof r> => !!r);
      if (rows.length) {
        await db
          .insert(commuteCache)
          .values(rows)
          .onConflictDoUpdate({
            target: [commuteCache.originKey, commuteCache.destKey, commuteCache.mode],
            set: { minutes: sql`excluded.minutes`, distanceM: sql`excluded.distance_m`, createdAt: sql`now()` },
          });
        rows.forEach((r) => hit.set(r.originKey, { ...r, id: 0, distanceM: r.distanceM, createdAt: new Date() }));
      }
    } catch (e) {
      console.error("[commute] Google 查詢失敗，改用估算", e);
    }
  }

  return origins.map((o) => {
    const c = hit.get(o.key);
    if (!c) return estimate(o); // Google 查不到路線時的備援
    const est = estimate(o); // 大眾運輸費用沿用估算（例如是否搭高鐵）
    const km = (c.distanceM ?? 0) / 1000;
    return {
      min: c.minutes,
      // Route Matrix 不回傳搭乘路線；若 Google 時間接近高鐵估算，才以高鐵票價計
      cost: mode === "transit" ? (est.via === "高鐵" && Math.abs(c.minutes - est.min) <= 10 ? est.cost : TPASS) : monthlyCost(mode, km, days),
      via: mode === "transit" ? "大眾運輸" : mode === "car" ? "開車（尖峰）" : "機車",
      source: "google",
      distanceM: c.distanceM ?? undefined,
    };
  });
}
