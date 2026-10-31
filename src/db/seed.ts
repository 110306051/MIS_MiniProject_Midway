/**
 * 匯入模擬資料：npm run db:seed
 * 可重複執行（會先清空候選地點、工作地、房源、租金、機能資料；不會刪除使用者的搜尋紀錄）。
 */
import "dotenv/config";
import { db, pool } from "./index";
import { candidatePoints, rentStats, amenityScores, workplacePresets, listings, commuteCache } from "./schema";
import { POINTS, WORKPLACES, ROOM_FACTOR } from "./seed-data";
import { AMENITIES, ROOM_TYPES } from "../lib/constants";

// 可重現的亂數（同一個地點每次產生相同房源）
function rng(seedStr: string) {
  let s = [...seedStr].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const STREETS = ["中正路", "民生路", "文化路", "中山路", "復興路", "光明街", "仁愛路", "和平街", "成功路", "自強街", "忠孝路", "信義街"];
const FEATURES = ["可養寵物", "可開伙", "有陽台", "近超市", "含管理費", "有車位", "對外窗", "可入籍", "近公園"];
const PING: Record<string, number> = { studio: 9, "2r": 22, "3r": 32 };
const PER_ROOM_TYPE = 20;

// 建物類型決定屋齡、電梯與樓層範圍
const BUILDINGS = [
  { kind: "新成屋社區", age: [0, 5], elevator: true, floors: [12, 24], weight: 0.15 },
  { kind: "電梯大樓", age: [6, 25], elevator: true, floors: [12, 20], weight: 0.35 },
  { kind: "華廈", age: [20, 35], elevator: true, floors: [7, 10], weight: 0.2 },
  { kind: "公寓", age: [30, 50], elevator: false, floors: [4, 5], weight: 0.3 },
];

/**
 * 模擬一間房子的租金：以該區行情為基準，依坪數、屋齡、到站距離、電梯調整，
 * 讓同一區裡有便宜（舊、小、遠）也有昂貴（新、大、近）的房子。
 */
function priceOf(median: number, ping: number, typicalPing: number, age: number, walk: number, elevator: boolean, noise: number) {
  const size = Math.pow(ping / typicalPing, 0.55);
  const ageF = age <= 5 ? 1.12 : age <= 15 ? 1.05 : age <= 30 ? 0.95 : 0.82;
  const walkF = 1 - 0.012 * (walk - 6);
  const elevF = elevator ? 1.02 : 0.94;
  return Math.round((median * size * ageF * walkF * elevF * noise) / 100) * 100;
}

async function main() {
  console.log("清空舊的參考資料…");
  await db.delete(listings);
  await db.delete(rentStats);
  await db.delete(amenityScores);
  await db.delete(candidatePoints);
  await db.delete(workplacePresets);
  await db.delete(commuteCache);

  console.log(`匯入 ${POINTS.length} 個候選地點`);
  await db.insert(candidatePoints).values(POINTS.map(({ id, name, city, lat, lng, lines }) => ({ id, name, city, lat, lng, lines })));

  await db.insert(rentStats).values(
    POINTS.flatMap((p) =>
      ROOM_TYPES.map((r) => ({ pointId: p.id, roomType: r.id, median: Math.round((p.rent2r * ROOM_FACTOR[r.id]) / 500) * 500 }))
    )
  );

  await db.insert(amenityScores).values(
    POINTS.flatMap((p) => AMENITIES.map((a, i) => ({ pointId: p.id, category: a.id, score: p.amen[i] })))
  );

  await db.insert(workplacePresets).values(WORKPLACES);

  console.log("產生模擬房源…");
  const rows = POINTS.flatMap((p) => {
    const rand = rng(p.id);
    const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
    const between = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
    const area = p.name.replace(/（.*）/, "");
    return ROOM_TYPES.flatMap((room) => {
      const batch = Array.from({ length: PER_ROOM_TYPE }, (_, i) => {
        const median = p.rent2r * ROOM_FACTOR[room.id];
        let r = rand();
        const b = BUILDINGS.find((x) => (r -= x.weight) < 0) ?? BUILDINGS[1];
        const age = between(b.age[0], b.age[1]);
        const walkMin = between(3, 18);
        const ping = Math.round(PING[room.id] * (0.75 + rand() * 0.55) * 10) / 10;
        const totalFloors = between(b.floors[0], b.floors[1]);
        const floor = between(b.elevator ? 2 : 1, totalFloors);
        // 依步行分鐘數把房源放在車站周圍（約 80 公尺／分鐘）
        const angle = rand() * Math.PI * 2;
        const meters = walkMin * 80;
        const lat = p.lat + (meters / 111000) * Math.sin(angle);
        const lng = p.lng + (meters / (111000 * Math.cos((p.lat * Math.PI) / 180))) * Math.cos(angle);
        const features = FEATURES.filter(() => rand() > 0.6).slice(0, 4);
        const street = pick(STREETS);
        return {
          id: `${p.id}-${room.id}-${i + 1}`,
          pointId: p.id,
          title: `${area}${street}・${b.kind}${room.zh}`,
          address: `${p.city}${area}${street}${between(1, 300)}號附近`,
          lat, lng,
          roomType: room.id,
          rent: priceOf(median, ping, PING[room.id], age, walkMin, b.elevator, 1 + (rand() - 0.5) * 0.16),
          ping,
          floor: `${floor}F / ${totalFloors}F`,
          walkMin,
          age,
          elevator: b.elevator,
          features,
        };
      });
      // 校正：讓這批房源的中位數等於該區行情，與 rent_stats 一致
      const sorted = batch.map((x) => x.rent).sort((a, b) => a - b);
      const med = (sorted[PER_ROOM_TYPE / 2 - 1] + sorted[PER_ROOM_TYPE / 2]) / 2;
      const k = (p.rent2r * ROOM_FACTOR[room.id]) / med;
      return batch.map((x) => ({ ...x, rent: Math.round((x.rent * k) / 100) * 100 }));
    });
  });
  await db.insert(listings).values(rows);
  console.log(`完成：${rows.length} 筆模擬房源`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
