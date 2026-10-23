"use client";

import type { Pick, Scored } from "@/lib/scoring";
import type { SearchInput } from "@/lib/types";

const fmt = (n: number) => Math.round(n).toLocaleString("zh-TW");
const num = (x: number) => (Math.abs(x) < 0.005 ? 0 : x).toFixed(2);

export default function AllTable({ scored, picks, input, selectedId, onSelect }: { scored: Scored[]; picks: Pick[]; input: SearchInput; selectedId: string | null; onSelect: (id: string) => void }) {
  const [A, B] = input.people;
  const pickIds = new Set(picks.map((p) => p.pointId));
  const rows = [...scored].sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.S - a.S);
  return (
    <>
      <p className="hint">
        共 {scored.length} 個候選地點，{scored.filter((r) => r.eligible).length} 個符合條件。地區是否推薦不看行情平均價，而是看「可接受價格內的房源」是否至少 2 間。點一列可在地圖上查看。
      </p>
      <div className="table-wrap">
        <table className="all-table">
          <thead>
            <tr>
              <th>地點</th><th>{A.name}</th><th>{B.name}</th><th>行情</th><th>可接受房源</th><th>交通費</th>
              <th className="num">公平</th><th className="num">省時</th><th className="num">成本</th><th className="num">機能</th><th className="num">總分</th><th>狀態</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.pointId} className={`${r.eligible ? "" : "out"} ${selectedId === r.pointId ? "sel" : ""}`} onClick={() => onSelect(r.pointId)}>
                <td><b>{r.name}</b><small>{r.city}</small></td>
                <td className={r.commute[0].min > A.max ? "bad" : ""}>{r.commute[0].min} 分</td>
                <td className={r.commute[1].min > B.max ? "bad" : ""}>{r.commute[1].min} 分</td>
                <td className={r.supply.pricey ? "warn" : ""}>{fmt(r.supply.market)}</td>
                <td className={r.supply.inBudget + r.supply.near < 2 ? "bad" : ""}>
                  {r.supply.inBudget + r.supply.near} / {r.supply.total}
                  {r.supply.near > 0 && <small>含略超 {r.supply.near}</small>}
                </td>
                <td>{fmt(r.commuteCost)}</td>
                <td className="num">{num(r.raw.f)}</td><td className="num">{num(r.raw.s)}</td><td className="num">{num(r.raw.r)}</td><td className="num">{num(r.raw.p)}</td>
                <td className="num"><b>{num(r.S)}</b></td>
                <td>{r.eligible ? (pickIds.has(r.pointId) ? <span className="tag t-best">推薦</span> : "符合") : <span className="why">{r.reasons.join("；")}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
