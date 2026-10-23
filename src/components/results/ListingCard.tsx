"use client";

import type { ListingView, SearchInput } from "@/lib/types";

const fmt = (n: number) => Math.round(n).toLocaleString("zh-TW");

/** 一筆房源：價格狀態、與行情比較、可能的取捨、兩人通勤 */
export default function ListingCard({ l, input, rank, showArea, onClick }: { l: ListingView; input: SearchInput; rank?: number; showArea?: boolean; onClick?: () => void }) {
  const [A, B] = input.people;
  const wantPet = input.prefs.includes("pet");
  const dim = l.priceStatus === "over" || l.overCommute;
  const shareA = (l.rent * input.splitA) / 100;

  return (
    <div className={`listing ${dim ? "dim" : ""} ${onClick ? "clickable" : ""}`} onClick={onClick}>
      <div className="ph" aria-hidden="true">
        {rank !== undefined && <span className="li-rank">{rank}</span>}
      </div>
      <div className="li-body">
        <h4>
          {showArea && <span className="li-area">{l.areaName}</span>}
          {l.title}
        </h4>
        <div className="li-meta">
          {l.ping} 坪・屋齡 {l.age} 年・{l.floor}
          {l.elevator ? "" : "（無電梯）"}・步行到站 {l.walkMin} 分
        </div>
        <div className="li-commute">
          <span><i className="dot dot-a" />{A.name} {l.commute[0].min} 分</span>
          <span><i className="dot dot-b" />{B.name} {l.commute[1].min} 分</span>
          <span className="li-score">分數 {l.score.toFixed(2)}</span>
        </div>
        <div className="li-tags">
          {l.priceStatus === "near" && <span className="flag-near">略超預算 +{fmt(l.overBy)}</span>}
          {l.vsMarketPct <= -10 && <span className="flag-cheap">比行情便宜 {-l.vsMarketPct}%</span>}
          {l.tradeoffs.map((t) => (
            <span key={t} className="flag-trade" title="可能的取捨">
              {t}
            </span>
          ))}
          {l.features.map((f) => (
            <span key={f} className={wantPet && f === "可養寵物" ? "hit" : ""}>
              {f}
            </span>
          ))}
        </div>
      </div>
      <div className={`li-price ${l.priceStatus}`}>
        <b>{fmt(l.rent)}</b>
        <small>元/月</small>
        {l.priceStatus === "over" ? (
          <em>超出預算</em>
        ) : l.overCommute ? (
          <em>通勤超過上限</em>
        ) : (
          <small>
            各付 {fmt(shareA)} / {fmt(l.rent - shareA)}
          </small>
        )}
      </div>
    </div>
  );
}
