"use client";

import type { Pick, Scored } from "@/lib/scoring";
import { areaName, cityName } from "@/lib/constants";
import type { SearchInput } from "@/lib/types";
import { useL } from "../site/LocaleProvider";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const num = (x: number) => (Math.abs(x) < 0.005 ? 0 : x).toFixed(2);

export default function AllTable({ scored, picks, input, selectedId, onSelect }: { scored: Scored[]; picks: Pick[]; input: SearchInput; selectedId: string | null; onSelect: (id: string) => void }) {
  const [A, B] = input.people;
  const { L, locale } = useL();
  const ok = scored.filter((r) => r.eligible).length;
  const pickIds = new Set(picks.map((p) => p.pointId));
  const rows = [...scored].sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.S - a.S);
  return (
    <>
      <p className="hint">
        {L(
          `共 ${scored.length} 個候選地點，${ok} 個符合條件。地區是否推薦不看行情平均價，而是看「可接受價格內的房源」是否至少 2 間。點一列可在地圖上查看。`,
          `${scored.length} candidate areas, ${ok} fit. An area qualifies on whether at least 2 homes fall within your price range, not on its average rent. Click a row to see it on the map.`
        )}
      </p>
      <div className="table-wrap">
        <table className="all-table">
          <thead>
            <tr>
              <th>{L("地點", "Area")}</th><th>{A.name}</th><th>{B.name}</th><th>{L("行情", "Typical")}</th><th>{L("可接受房源", "In range")}</th><th>{L("交通費", "Travel")}</th>
              <th className="num">{L("公平", "Fair")}</th><th className="num">{L("省時", "Time")}</th><th className="num">{L("成本", "Cost")}</th><th className="num">{L("機能", "Amen.")}</th><th className="num">{L("總分", "Total")}</th><th>{L("狀態", "Status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.pointId} className={`${r.eligible ? "" : "out"} ${selectedId === r.pointId ? "sel" : ""}`} onClick={() => onSelect(r.pointId)}>
                <td><b>{areaName(r.pointId, r.name, locale)}</b><small>{cityName(r.city, locale)}</small></td>
                <td className={r.commute[0].min > A.max ? "bad" : ""}>{r.commute[0].min}{L(" 分", "′")}</td>
                <td className={r.commute[1].min > B.max ? "bad" : ""}>{r.commute[1].min}{L(" 分", "′")}</td>
                <td className={r.supply.pricey ? "warn" : ""}>{fmt(r.supply.market)}</td>
                <td className={r.supply.inBudget + r.supply.near < 2 ? "bad" : ""}>
                  {r.supply.inBudget + r.supply.near} / {r.supply.total}
                  {r.supply.near > 0 && <small>{L(`含略超 ${r.supply.near}`, `${r.supply.near} over`)}</small>}
                </td>
                <td>{fmt(r.commuteCost)}</td>
                <td className="num">{num(r.raw.f)}</td><td className="num">{num(r.raw.s)}</td><td className="num">{num(r.raw.r)}</td><td className="num">{num(r.raw.p)}</td>
                <td className="num"><b>{num(r.S)}</b></td>
                <td>{r.eligible ? (pickIds.has(r.pointId) ? <span className="tag t-best">{L("推薦", "Pick")}</span> : L("符合", "Fits")) : <span className="why">{r.reasons.join(L("；", "; "))}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
