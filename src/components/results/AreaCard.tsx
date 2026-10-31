"use client";

import { useState } from "react";
import type { Pick, Scored } from "@/lib/scoring";
import { templateExplain } from "@/lib/scoring";
import { TPASS, areaName, cityName, viaName } from "@/lib/constants";
import { tagName } from "@/lib/i18n";
import type { SearchInput } from "@/lib/types";
import { useL } from "../site/LocaleProvider";

export const WEIGHT_DEFS = [
  { key: "f", zh: "公平", en: "Fairness", desc: "比較辛苦的人不要太辛苦", descEn: "The one with the longer ride shouldn't suffer" },
  { key: "s", zh: "省時", en: "Time", desc: "兩人總通勤時間短", descEn: "Less total time commuting" },
  { key: "r", zh: "省錢", en: "Money", desc: "租金（與交通費）低", descEn: "Lower rent (and travel costs)" },
  { key: "p", zh: "生活機能", en: "Amenities", desc: "符合你們勾選的偏好", descEn: "Matches what you want nearby" },
] as const;

const TAG_CLASS: Record<string, string> = { 綜合最佳: "t-best", 最公平: "t-f", 最省時: "t-s", 最省錢: "t-r", 生活機能最好: "t-p", 選擇最多: "t-supply" };
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

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
  const { L, locale } = useL();
  const [showCalc, setShowCalc] = useState(false);
  const [ai, setAi] = useState<{ lines: string[]; source: string; key: string } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const weightKey = `${r.w.f.toFixed(3)}-${r.w.s.toFixed(3)}-${r.w.r.toFixed(3)}-${r.w.p.toFixed(3)}-${includeCost}-${r.supply.near}-${locale}`;
  const lines = ai && ai.key === weightKey ? ai.lines : templateExplain(r, input, top, locale);
  const maxMin = Math.max(A.max, B.max, r.commute[0].min, r.commute[1].min);
  const n = (x: number) => x.toFixed(3);

  const bar = (min: number, max: number, cls: string) => (
    <div className="cbar">
      <div className={`cfill ${cls}`} style={{ width: `${(min / maxMin) * 100}%` }} />
      <div className="cmax" style={{ left: `${(max / maxMin) * 100}%` }} title={L(`上限 ${max} 分`, `Limit ${max} min`)} />
    </div>
  );

  return (
    <article className={`card ${selected ? "selected" : ""}`} onClick={(e) => !(e.target as HTMLElement).closest("button") && onSelect()}>
      <header className="card-head">
        <span className="rank">{rank}</span>
        <div className="card-title">
          <h3>{areaName(r.pointId, r.name, locale)}</h3>
          <span className="city">{cityName(r.city, locale)}</span>
        </div>
        <div className="tags">
          {r.tags.map((t) => (
            <span key={t} className={`tag ${TAG_CLASS[t]}`}>
              {tagName(t, locale)}
            </span>
          ))}
          {r.supply.pricey && <span className="tag t-warn" title={L("該區行情高於預算，但仍有符合預算的房源", "Typical rent is above budget, but some homes still fit")}>{L("行情偏高", "Pricey area")}</span>}
          {vote[0] && vote[1] && <span className="tag t-agree">{L("✓ 兩人都喜歡", "✓ You both like it")}</span>}
        </div>
        <div className="score" title={L("總分 S", "Total score S")}>
          <b>{r.S.toFixed(2)}</b>
          <small>{L("分", "pts")}</small>
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
              <span className="cmin">{r.commute[i].min}{L(" 分", "′")}</span>
              <span className="cvia">{viaName(r.commute[i].via, locale)}</span>
            </div>
          ))}
        </div>
        <div className="money">
          <div className={r.supply.pricey ? "warn" : ""}><small>{L("該區行情", "Typical rent")}</small><b>{fmt(r.supply.market)}</b></div>
          <div><small>{r.supply.pricey ? L("預算內最低", "Cheapest in budget") : L("可租價格（中位）", "What you'd pay (median)")}</small><b>{fmt(r.supply.pricey ? r.supply.minRent ?? r.rent : r.rent)}</b></div>
          <div>
            <small>{L("可接受房源", "Homes in range")}</small>
            <b>{r.supply.inBudget + r.supply.near}{L(" 間", "")}</b>
            {r.supply.near > 0 && <em className="near-count">{L(`含略超 ${r.supply.near}`, `${r.supply.near} slightly over`)}</em>}
          </div>
          <div><small>{L("兩人交通費", "Travel, both")}</small><b>{fmt(r.commuteCost)}</b></div>
        </div>
        <p className="share-line">
          {L(`以可租價格 ${fmt(r.rent)} 元計：${A.name} 付 ${fmt(r.shareA)}、${B.name} 付 ${fmt(r.shareB)}`, `At NT$${fmt(r.rent)}: ${A.name} pays ${fmt(r.shareA)}, ${B.name} pays ${fmt(r.shareB)}`)}
        </p>

        <div className="stack-wrap">
          <div className="stack" title={L("分數組成", "Score breakdown")}>
            {WEIGHT_DEFS.map((d) => (
              <span key={d.key} className={`seg w-${d.key}`} style={{ width: `${Math.max(0, r.parts[d.key]) * 100}%` }} />
            ))}
          </div>
          <div className="stack-legend">
            {WEIGHT_DEFS.map((d) => (
              <span key={d.key}>
                <i className={`wdot w-${d.key}`} />
                {d[locale]} {Math.max(0, r.parts[d.key]).toFixed(2)}
              </span>
            ))}
          </div>
        </div>

        <div className="ai">
          <div className="ai-head">
            <span className="ai-badge">{L("AI 取捨說明", "Trade-offs")}</span>
            <small>{ai && ai.key === weightKey && ai.source === "llm" ? L("由 AI 依目前權重生成", "Written by AI for these weights") : L("規則模板", "Rule-based")}</small>
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
                {aiBusy ? L("AI 撰寫中…", "Writing…") : L("用 AI 說明", "Explain with AI")}
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
              title={me === null ? L("先在「一起決定」選擇你是誰", "First choose who you are under “Decide together”") : me !== i ? L("只有本人可以投票", "Only this person can vote") : ""}
              onClick={onVote}
            >
              {vote[i] ? "♥" : "♡"} {input.people[i].name}
            </button>
          ))}
          {me === null && <small className="vote-hint">{L("在「一起決定」選擇你是誰後就能投票", "Pick who you are under “Decide together” to vote")}</small>}
        </div>
        <div className="actions">
          <button type="button" className="ghost-btn sm" onClick={() => setShowCalc((s) => !s)}>
            {showCalc ? L("收起計算", "Hide maths") : L("計算過程", "Show maths")}
          </button>
          <button type="button" className="primary-btn sm" onClick={onListings}>
            {L("看這區房源", "See homes here")}
          </button>
        </div>
      </footer>

      {showCalc && (
        <div className="calc">
          <table className="calc-table">
            <tbody>
              <tr><th>{L("公平", "Fairness")} f</th><td>1 − max({r.commute[0].min}÷{A.max}, {r.commute[1].min}÷{B.max})</td><td>{n(r.raw.f)}</td><td>× {n(r.w.f)}</td><td>{n(r.parts.f)}</td></tr>
              <tr><th>{L("省時", "Time")} s</th><td>1 − ({A.days}×{r.commute[0].min} + {B.days}×{r.commute[1].min}) ÷ ({A.days}×{A.max} + {B.days}×{B.max})</td><td>{n(r.raw.s)}</td><td>× {n(r.w.s)}</td><td>{n(r.parts.s)}</td></tr>
              <tr><th>{L("成本", "Cost")} r</th><td>{includeCost ? L(`1 − (可租價格 ${fmt(r.rent)} + 交通費 ${fmt(r.commuteCost)}) ÷ (${fmt(input.budget)} + ${fmt(2 * TPASS)})`, `1 − (rent ${fmt(r.rent)} + travel ${fmt(r.commuteCost)}) ÷ (${fmt(input.budget)} + ${fmt(2 * TPASS)})`) : L(`1 − 可租價格 ${fmt(r.rent)} ÷ ${fmt(input.budget)}`, `1 − rent ${fmt(r.rent)} ÷ ${fmt(input.budget)}`)}</td><td>{n(r.raw.r)}</td><td>× {n(r.w.r)}</td><td>{n(r.parts.r)}</td></tr>
              <tr><th>{L("機能", "Amenities")} p</th><td>{input.prefs.length ? L("所選偏好分數平均", "Average of the amenities you picked") : L("未選偏好，預設 0.5", "None picked, defaults to 0.5")}</td><td>{n(r.raw.p)}</td><td>× {n(r.w.p)}</td><td>{n(r.parts.p)}</td></tr>
              <tr className="total"><th>{L("總分", "Total")} S</th><td colSpan={3}>{L("四項相加", "Sum of the four")}</td><td>{n(r.S)}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
