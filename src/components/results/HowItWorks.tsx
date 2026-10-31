"use client";

import type { Metrics } from "@/lib/types";
import { useL } from "../site/LocaleProvider";

export default function HowItWorks({ source }: { source: Metrics["commuteSource"] }) {
  const { L } = useL();
  const steps: [string, string][] = [
    [
      L("計算通勤", "Time the commutes"),
      source === "estimate"
        ? L(
            "目前為估算模式：以直線距離、繞行係數、候車與轉乘時間估計。設定 Google Maps 金鑰後會改用 Routes API 查詢真實的尖峰時段通勤時間。",
            "Estimate mode: straight-line distance × a detour factor, plus waiting and transfer time. With a Google Maps key it switches to the Routes API for real rush-hour times."
          )
        : L(
            "以 Google Routes API 查詢每個候選地點到兩人工作地的尖峰時段通勤時間（大眾運輸以工作日早上 9 點前抵達計算），結果快取 30 天。",
            "The Google Routes API times every candidate area to both workplaces at rush hour (transit: arriving by 9 am on a weekday). Results are cached for 30 days."
          ),
    ],
    [
      L("硬性條件過濾", "Hard filters"),
      L(
        "任一人通勤超過自己設定的上限就排除。租金不看該區的平均行情，而是看「預算內（含預算彈性）找不找得到房子」：至少有 2 間才推薦。所以行情偏高的地區，只要還有便宜的房子就不會被排除。",
        "An area is dropped if either commute is over that person's limit. Rent isn't judged by the area average but by whether homes exist within budget (plus flex): at least 2 are needed. So a pricey area stays in if it still has cheaper homes."
      ),
    ],
    [L("四項分數正規化", "Normalise four scores"), L("把分鐘、元等不同單位轉成 0 到 1，越接近 1 越好。", "Minutes and NT$ are turned into 0–1 scores; closer to 1 is better.")],
    [L("依權重加總", "Weight and sum"), L("兩人一起決定四項的相對重要性，得到總分 S 並排序。", "You both set how much each score matters, giving a total S to rank by.")],
    [
      L("挑出不同類型方案", "Pick a varied shortlist"),
      L("除了總分最高，也放入「最公平」「最省時」「最省錢」「生活機能最好」的代表，避免推薦結果都很像。", "Beyond the top score, the fairest, fastest, cheapest and best-for-amenities areas are included so the picks aren't all alike."),
    ],
    [
      L("區域內房源再評分", "Re-score homes inside an area"),
      L("選定區域後，用同一個公式對該區每一筆房源重新計分（各房源的實際座標、租金、是否可養寵物）。", "Open an area and every home is scored with the same formula, using its own location, rent and pet policy."),
    ],
  ];
  const limits = [
    L("租金行情、生活機能分數與房源皆為模擬資料。", "Rents, amenity scores and listings are simulated."),
    L("行情偏高地區的便宜房源通常有代價（屋齡、坪數、離站距離），系統會標示出來，但無法判斷屋況好壞。", "Cheap homes in pricey areas usually have a catch (age, size, distance). These are flagged, but condition can't be judged."),
    L("Google Route Matrix 不回傳搭乘路線，所以大眾運輸交通費以都會通月票估算。", "Google's Route Matrix doesn't return the route taken, so transit cost assumes the NT$1,200 TPASS."),
    L("線性懲罰：假設 30→40 分鐘與 70→80 分鐘一樣痛苦。", "Linear penalty: 30→40 min is treated as just as painful as 70→80 min."),
    L("權重主觀：之後可用 AHP 兩兩比較決定權重。", "Weights are subjective; AHP pairwise comparison could set them later."),
  ];

  return (
    <div className="how">
      <ol className="steps">
        {steps.map(([t, d]) => (
          <li key={t}>
            <b>{t}</b>
            <span>{d}</span>
          </li>
        ))}
      </ol>
      <div className="formula">
        <div className="f-main">
          S = w<sub>f</sub>·f + w<sub>s</sub>·s + w<sub>r</sub>·r + w<sub>p</sub>·p
        </div>
        <dl>
          <dt><i className="wdot w-f" />{L("公平", "Fairness")} f</dt>
          <dd>1 − max(t<sub>A</sub>/T<sub>A</sub>, t<sub>B</sub>/T<sub>B</sub>)　{L("只看比較辛苦的那個人（minimax）", "only the person with the harder ride counts (minimax)")}</dd>
          <dt><i className="wdot w-s" />{L("省時", "Time")} s</dt>
          <dd>1 − (d<sub>A</sub>t<sub>A</sub> + d<sub>B</sub>t<sub>B</sub>) / (d<sub>A</sub>T<sub>A</sub> + d<sub>B</sub>T<sub>B</sub>)　{L("依進辦公室天數加權的總通勤（minisum）", "total commute weighted by office days (minisum)")}</dd>
          <dt><i className="wdot w-r" />{L("成本", "Cost")} r</dt>
          <dd>1 − {L("每月成本 / 預算　租金使用「可接受範圍內房源的中位數」，也就是你們實際會租到的價格；可勾選是否計入交通費", "monthly cost / budget — rent is the median of homes in your range, i.e. what you'd actually pay; travel cost optional")}</dd>
          <dt><i className="wdot w-p" />{L("機能", "Amenities")} p</dt>
          <dd>{L("所勾選生活機能在該區的分數平均", "average score of the amenities you picked")}</dd>
        </dl>
        <p className="hint">{L("t：單程通勤分鐘；T：各自可接受的上限；d：每週進辦公室天數。", "t: one-way minutes; T: each person's limit; d: office days per week.")}</p>
      </div>
      <div className="limits">
        <h4>{L("目前限制", "Current limits")}</h4>
        <ul>
          {limits.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
