/**
 * Google Maps Platform（只在後端執行，金鑰：GOOGLE_MAPS_SERVER_KEY）
 *  - Routes API：computeRouteMatrix 取得尖峰時段通勤時間
 *  - Places API (New)：地址自動完成、地點座標
 */
import type { Mode } from "../constants";

const KEY = () => process.env.GOOGLE_MAPS_SERVER_KEY || "";
export const hasGoogleServer = () => KEY().length > 0;

type LatLng = { lat: number; lng: number };
const wp = (p: LatLng) => ({ waypoint: { location: { latLng: { latitude: p.lat, longitude: p.lng } } } });

/** 下一個工作日的台北時間 hh:mm（轉成 UTC ISO 字串） */
export function nextWeekdayTaipei(hour: number, minute: number) {
  const now = Date.now();
  for (let d = 1; d <= 7; d++) {
    const t = new Date(now + d * 86400000 + 8 * 3600000); // 以台北日期判斷星期
    const dow = t.getUTCDay();
    if (dow >= 1 && dow <= 5) {
      return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), hour - 8, minute)).toISOString();
    }
  }
  return new Date(now + 86400000).toISOString();
}

const TRAVEL_MODE: Record<Mode, string> = { transit: "TRANSIT", car: "DRIVE", scooter: "TWO_WHEELER" };

type MatrixElement = {
  originIndex?: number;
  destinationIndex?: number;
  status?: { code?: number; message?: string };
  condition?: string;
  distanceMeters?: number;
  duration?: string;
};

/**
 * 多個起點 → 一個終點的通勤時間。回傳與 origins 同順序的結果（查不到為 null）。
 * 大眾運輸每次請求最多 100 組，所以自動分批。
 */
export async function routeMatrix(origins: LatLng[], dest: LatLng, mode: Mode) {
  const out: ({ minutes: number; distanceM: number } | null)[] = origins.map(() => null);
  const batch = 100;
  for (let start = 0; start < origins.length; start += batch) {
    const slice = origins.slice(start, start + batch);
    const body: Record<string, unknown> = {
      origins: slice.map(wp),
      destinations: [wp(dest)],
      travelMode: TRAVEL_MODE[mode],
      languageCode: "zh-TW",
      regionCode: "TW",
    };
    if (mode === "transit") body.arrivalTime = nextWeekdayTaipei(9, 0); // 早上 9 點前抵達
    else {
      body.routingPreference = "TRAFFIC_AWARE";
      body.departureTime = nextWeekdayTaipei(8, 15);
    }
    const res = await fetch("https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY(),
        "X-Goog-FieldMask": "originIndex,destinationIndex,status,condition,distanceMeters,duration",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[Routes API]", res.status, await res.text());
      continue; // 這一批改用估算
    }
    const elements = (await res.json()) as MatrixElement[];
    for (const e of elements) {
      // proto3 JSON 會省略值為 0 的欄位，所以 originIndex 不存在代表 0
      const i = start + (e.originIndex ?? 0);
      if (e.condition !== "ROUTE_EXISTS" || !e.duration) continue;
      out[i] = { minutes: Math.round(parseInt(e.duration, 10) / 60), distanceM: e.distanceMeters ?? 0 };
    }
  }
  return out;
}

export type PlaceSuggestion = { placeId: string; main: string; secondary: string };

export async function placesAutocomplete(input: string, sessionToken?: string): Promise<PlaceSuggestion[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY() },
    body: JSON.stringify({
      input,
      languageCode: "zh-TW",
      includedRegionCodes: ["tw"],
      sessionToken,
      // 偏向雙北桃園
      locationBias: { rectangle: { low: { latitude: 24.85, longitude: 121.05 }, high: { latitude: 25.25, longitude: 121.75 } } },
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Places autocomplete ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as {
    suggestions?: { placePrediction?: { placeId: string; text?: { text: string }; structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } } } }[];
  };
  return (json.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({
      placeId: p.placeId,
      main: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
      secondary: p.structuredFormat?.secondaryText?.text ?? "",
    }));
}

export async function placeDetails(placeId: string, sessionToken?: string) {
  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
  url.searchParams.set("languageCode", "zh-TW");
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);
  const res = await fetch(url, {
    headers: { "X-Goog-Api-Key": KEY(), "X-Goog-FieldMask": "id,displayName,formattedAddress,location" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Place details ${res.status}: ${await res.text()}`);
  const p = (await res.json()) as { id: string; displayName?: { text: string }; formattedAddress?: string; location: { latitude: number; longitude: number } };
  return { placeId: p.id, label: p.displayName?.text ?? p.formattedAddress ?? "", address: p.formattedAddress ?? "", lat: p.location.latitude, lng: p.location.longitude };
}
