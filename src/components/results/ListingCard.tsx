"use client";

import { areaName, featureName, listingTitle } from "@/lib/constants";
import type { ListingView, SearchInput } from "@/lib/types";
import { useL } from "../site/LocaleProvider";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/** 一筆房源：價格狀態、與行情比較、可能的取捨、兩人通勤 */
export default function ListingCard({ l, input, rank, showArea, onClick }: { l: ListingView; input: SearchInput; rank?: number; showArea?: boolean; onClick?: () => void }) {
  const [A, B] = input.people;
  const { L, locale } = useL();
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
          {showArea && <span className="li-area">{areaName(l.pointId, l.areaName, locale)}</span>}
          {listingTitle(l.title, l.pointId, locale)}
        </h4>
        <div className="li-meta">
          {L(`${l.ping} 坪・屋齡 ${l.age} 年・${l.floor}`, `${l.ping} ping · ${l.age} yrs · ${l.floor}`)}
          {l.elevator ? "" : L("（無電梯）", " (no lift)")}
          {L(`・步行到站 ${l.walkMin} 分`, ` · ${l.walkMin} min to station`)}
        </div>
        <div className="li-commute">
          <span><i className="dot dot-a" />{A.name} {l.commute[0].min}{L(" 分", "′")}</span>
          <span><i className="dot dot-b" />{B.name} {l.commute[1].min}{L(" 分", "′")}</span>
          <span className="li-score">{L("分數", "Score")} {l.score.toFixed(2)}</span>
        </div>
        <div className="li-tags">
          {l.priceStatus === "near" && <span className="flag-near">{L("略超預算", "Over by")} +{fmt(l.overBy)}</span>}
          {l.vsMarketPct <= -10 && <span className="flag-cheap">{L(`比行情便宜 ${-l.vsMarketPct}%`, `${-l.vsMarketPct}% under typical`)}</span>}
          {l.tradeoffs.map((t) => (
            <span key={t} className="flag-trade" title={L("可能的取捨", "Possible trade-off")}>
              {t}
            </span>
          ))}
          {l.features.map((f) => (
            <span key={f} className={wantPet && f === "可養寵物" ? "hit" : ""}>
              {featureName(f, locale)}
            </span>
          ))}
        </div>
      </div>
      <div className={`li-price ${l.priceStatus}`}>
        <b>{fmt(l.rent)}</b>
        <small>{L("元/月", "NT$/mo")}</small>
        {l.priceStatus === "over" ? (
          <em>{L("超出預算", "Over budget")}</em>
        ) : l.overCommute ? (
          <em>{L("通勤超過上限", "Commute too long")}</em>
        ) : (
          <small>
            {L("各付", "Split")} {fmt(shareA)} / {fmt(l.rent - shareA)}
          </small>
        )}
      </div>
    </div>
  );
}
