"use client";

import { useState } from "react";
import type { Pick, Scored } from "@/lib/scoring";
import { templateExplain } from "@/lib/scoring";
import { TPASS } from "@/lib/constants";
import type { SearchInput } from "@/lib/types";

export const WEIGHT_DEFS = [
  { key: "f", name: "公平", desc: "比較辛苦的人不要太辛苦" },
  { key: "s", name: "省時", desc: "兩人總通勤時間短" },
  { key: "r", name: "省錢", desc: "租金（與交通費）低" },
  { key: "p", name: "生活機能", desc: "符合你們勾選的偏好" },
] as const;

const TAG_CLASS: Record<string, string> = { 綜合最佳: "t-best", 最公平: "t-f", 最省時: "t-s", 最省錢: "t-r", 生活機能最好: "t-p", 選擇最多: "t-supply" };
const fmt = (n: number) => Math.round(n).toLocaleString("zh-TW");

type Props = {
  r: Pick;
  rank: number;
  top: Scored;
  input: SearchInput;
  includeCost: boolean;
  selected: boolean;
  vote: [boolean, boolean];
  me: 0 | 1 | null;
  llm: boolean;
  onSelect: () => void;
  onVote: () => void;
  onListings: () => void;
  onAskAI: () => Promise<{ lines: string[]; source: string }>;
};

export default function AreaCard({ r, rank, top, input, includeCost, selected, vote, me, llm, onSelect, onVote, onListings, onAskAI }: Props) {
  const [A, B] = input.people;
  const [showCalc, setShowCalc] = useState(false);
  const [ai, setAi] = useState<{ lines: string[]; source: string; key: string } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const weightKey = `${r.w.f.toFixed(3)}-${r.w.s.toFixed(3)}-${r.w.r.toFixed(3)}-${r.w.p.toFixed(3)}-${includeCost}-${r.supply.near}`;
  const lines = ai && ai.key === weightKey ? ai.lines : templateExplain(r, input, top);
  const maxMin = Math.max(A.max, B.max, r.commute[0].min, r.commute[1].min);
  const n = (x: number) => x.toFixed(3);

  const bar = (min: number, max: number, cls: string) => (
    <div className="cbar">
      <div className={`cfill ${cls}`} style={{ width: `${(min / maxMin) * 100}%` }} />
      <div className="cmax" style={{ left: `${(max / maxMin) * 100}%` }} title={`上限 ${max} 分`} />
    </div>
  );

  return (
    <article className={`card ${selected ? "selected" : ""}`} onClick={(e) => !(e.target as HTMLElement).closest("button") && onSelect()}>
      <header className="card-head">
        <span className="rank">{rank}</span>
        <div className="card-title">
          <h3>{r.name}</h3>
          <span className="city">{r.city}</span>
        </div>
        <div className="tags">
          {r.tags.map((t) => (
            <span key={t} className={`tag ${TAG_CLASS[t]}`}>
              {t}
            </span>
          ))}
          {r.supply.pricey && <span className="tag t-warn" title="該區行情高於預算，但仍有符合預算的房源">行情偏高</span>}
          {vote[0] && vote[1] && <span className="tag t-agree">✓ 兩人都喜歡</span>}
        </div>
        <div className="score" title="總分 S">
          <b>{r.S.toFixed(2)}</b>
          <small>分</small>
        </div>
      </header>

      <div className="card-body">
        <div className="commutes">
          {([0, 1] as const).map((i) => (
            <div className="crow" key={i}>
              <span className="cname">
                <span className={`dot ${i ? "dot-b" : "dot-a"}`} />
                {input.people[i].name}
              </span>
              {bar(r.commute[i].min, input.people[i].max, i ? "fb" : "fa")}
              <span className="cmin">{r.commute[i].min} 分</span>
              <span className="cvia">{r.commute[i].via}</span>
            </div>
          ))}
        </div>
        <div className="money">
          <div className={r.supply.pricey ? "warn" : ""}><small>該區行情</small><b>{fmt(r.supply.market)}</b></div>
          <div><small>{r.supply.pricey ? "預算內最低" : "可租價格（中位）"}</small><b>{fmt(r.supply.pricey ? r.supply.minRent ?? r.rent : r.rent)}</b></div>
          <div>
            <small>可接受房源</small>
            <b>{r.supply.inBudget + r.supply.near} 間</b>
            {r.supply.near > 0 && <em className="near-count">含略超 {r.supply.near}</em>}
          </div>
          <div><small>兩人交通費</small><b>{fmt(r.commuteCost)}</b></div>
        </div>
        <p className="share-line">
          以可租價格 {fmt(r.rent)} 元計：{A.name} 付 {fmt(r.shareA)}、{B.name} 付 {fmt(r.shareB)}
        </p>

        <div className="stack-wrap">
          <div className="stack" title="分數組成">
            {WEIGHT_DEFS.map((d) => (
              <span key={d.key} className={`seg w-${d.key}`} style={{ width: `${Math.max(0, r.parts[d.key]) * 100}%` }} />
            ))}
          </div>
          <div className="stack-legend">
            {WEIGHT_DEFS.map((d) => (
              <span key={d.key}>
                <i className={`wdot w-${d.key}`} />
                {d.name} {Math.max(0, r.parts[d.key]).toFixed(2)}
              </span>
            ))}
          </div>
        </div>

        <div className="ai">
          <div className="ai-head">
            <span className="ai-badge">AI 取捨說明</span>
            <small>{ai && ai.key === weightKey && ai.source === "llm" ? "由 AI 依目前權重生成" : "規則模板"}</small>
            {llm && (
              <button
                type="button"
                className="ai-btn"
                disabled={aiBusy}
                onClick={async () => {
                  setAiBusy(true);
                  try {
                    const res = await onAskAI();
                    setAi({ ...res, key: weightKey });
                  } finally {
                    setAiBusy(false);
                  }
                }}
              >
                {aiBusy ? "AI 撰寫中…" : "用 AI 說明"}
              </button>
            )}
          </div>
          <ul>
            {lines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="card-foot">
        <div className="votes">
          {([0, 1] as const).map((i) => (
            <button
              key={i}
              type="button"
              className={`vote ${i ? "vb" : "va"} ${vote[i] ? "on" : ""}`}
              disabled={me !== i}
              title={me === null ? "先在左側選擇你是誰" : me !== i ? "只有本人可以投票" : ""}
              onClick={onVote}
            >
              {vote[i] ? "♥" : "♡"} {input.people[i].name}
            </button>
          ))}
        </div>
        <div className="actions">
          <button type="button" className="ghost-btn sm" onClick={() => setShowCalc((s) => !s)}>
            {showCalc ? "收起計算" : "計算過程"}
          </button>
          <button type="button" className="primary-btn sm" onClick={onListings}>
            看這區房源
          </button>
        </div>
      </footer>

      {showCalc && (
        <div className="calc">
          <table className="calc-table">
            <tbody>
              <tr><th>公平 f</th><td>1 − max({r.commute[0].min}÷{A.max}, {r.commute[1].min}÷{B.max})</td><td>{n(r.raw.f)}</td><td>× {n(r.w.f)}</td><td>{n(r.parts.f)}</td></tr>
              <tr><th>省時 s</th><td>1 − ({A.days}×{r.commute[0].min} + {B.days}×{r.commute[1].min}) ÷ ({A.days}×{A.max} + {B.days}×{B.max})</td><td>{n(r.raw.s)}</td><td>× {n(r.w.s)}</td><td>{n(r.parts.s)}</td></tr>
              <tr><th>成本 r</th><td>{includeCost ? `1 − (可租價格 ${fmt(r.rent)} + 交通費 ${fmt(r.commuteCost)}) ÷ (${fmt(input.budget)} + ${fmt(2 * TPASS)})` : `1 − 可租價格 ${fmt(r.rent)} ÷ ${fmt(input.budget)}`}</td><td>{n(r.raw.r)}</td><td>× {n(r.w.r)}</td><td>{n(r.parts.r)}</td></tr>
              <tr><th>機能 p</th><td>{input.prefs.length ? "所選偏好分數平均" : "未選偏好，預設 0.5"}</td><td>{n(r.raw.p)}</td><td>× {n(r.w.p)}</td><td>{n(r.parts.p)}</td></tr>
              <tr className="total"><th>總分 S</th><td colSpan={3}>四項相加</td><td>{n(r.S)}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
