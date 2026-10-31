"use client";

import { useEffect, useState } from "react";
import { useL } from "./LocaleProvider";

/**
 * 首頁主視覺：互動式路線圖。
 * 三組情境輪播（也可以點選），每次切換兩條路線重新「畫出來」，
 * 列車沿著路線來回跑，中間點持續發出脈衝。系統設定「減少動態」時只顯示靜態結果。
 */
type Stop = { x: number; y: number; zh: string; en: string };
type Scenario = {
  id: string;
  a: Stop; b: Stop; mid: Stop;
  pathA: string; pathB: string;
  minA: number; minB: number;
  /** 分鐘數標籤的位置 */
  labelA: [number, number]; labelB: [number, number];
  /** 中間點說明卡的位置 */
  card: [number, number];
};

const SCENARIOS: Scenario[] = [
  {
    id: "s1",
    a: { x: 70, y: 400, zh: "青埔", en: "Qingpu" },
    b: { x: 590, y: 110, zh: "信義", en: "Xinyi" },
    mid: { x: 330, y: 270, zh: "新莊", en: "Xinzhuang" },
    pathA: "M70 400 H200 L330 270",
    pathB: "M590 110 H490 L330 270",
    minA: 48, minB: 40,
    labelA: [150, 440], labelB: [520, 88],
    card: [356, 288],
  },
  {
    id: "s2",
    a: { x: 60, y: 330, zh: "中壢", en: "Zhongli" },
    b: { x: 580, y: 70, zh: "內湖", en: "Neihu" },
    mid: { x: 380, y: 200, zh: "三重", en: "Sanchong" },
    pathA: "M60 330 H250 L380 200",
    pathB: "M580 70 V120 L500 200 H380",
    minA: 50, minB: 42,
    labelA: [150, 370], labelB: [610, 160],
    card: [176, 120],
  },
  {
    id: "s3",
    a: { x: 150, y: 110, zh: "林口", en: "Linkou" },
    b: { x: 600, y: 230, zh: "南港", en: "Nangang" },
    mid: { x: 380, y: 350, zh: "板橋", en: "Banqiao" },
    pathA: "M150 110 V180 L320 350 H380",
    pathB: "M600 230 V260 L510 350 H380",
    minA: 37, minB: 35,
    labelA: [110, 250], labelB: [628, 330],
    card: [150, 392],
  },
];

/** 背景的城市路網（裝飾） */
const NETWORK = [
  "M0 230 H160 L260 130 H640",
  "M40 0 V90 L210 260 V480",
  "M640 300 H470 L400 370 V480",
  "M300 0 V60 L420 180 H640",
  "M0 450 L120 330 H230",
];
const STATIONS = [
  [160, 230], [260, 130], [470, 130], [210, 260], [210, 400], [470, 300], [400, 420], [300, 60], [420, 180], [540, 180], [120, 330], [40, 90],
];

export default function HeroRoutes() {
  const { locale, L } = useL();
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!auto || still) return;
    const t = setInterval(() => setI((x) => (x + 1) % SCENARIOS.length), 6500);
    return () => clearInterval(t);
  }, [auto, still]);

  const s = SCENARIOS[i];
  const n = (st: Stop) => st[locale];
  const diff = Math.abs(s.minA - s.minB);
  const nameA = L("小明", "Alex");
  const nameB = L("小華", "Sam");
  const cardW = locale === "en" ? 228 : 196;

  return (
    <div className="hero-art">
      <svg
        className={`routes ${still ? "still" : ""}`}
        viewBox="0 0 660 480"
        role="img"
        aria-label={L(
          `路線圖：${nameA}從${s.a.zh}、${nameB}從${s.b.zh}出發，在${s.mid.zh}交會，通勤分別 ${s.minA} 與 ${s.minB} 分鐘`,
          `Route map: ${nameA} from ${s.a.en} and ${nameB} from ${s.b.en} meet at ${s.mid.en}, commuting ${s.minA} and ${s.minB} minutes`
        )}
      >
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--hero-btn)" stopOpacity=".4" />
            <stop offset="100%" stopColor="var(--hero-btn)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 城市路網 */}
        <g className="net">
          {NETWORK.map((d) => (
            <path key={d} d={d} />
          ))}
          {STATIONS.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" />
          ))}
        </g>

        <g key={s.id}>
          {/* 中間點光暈 */}
          <circle className="glow" cx={s.mid.x} cy={s.mid.y} r="90" fill="url(#glow)" />

          {/* 兩條路線 */}
          <path className="line line-a" pathLength={1} d={s.pathA} />
          <path className="line line-b" pathLength={1} d={s.pathB} />

          {/* 列車 */}
          {!still && (
            <>
              <circle className="train train-a" r="7">
                <animateMotion dur="2.8s" begin="1.4s" repeatCount="indefinite" path={s.pathA} keyPoints="0;1;1" keyTimes="0;.8;1" calcMode="linear" />
              </circle>
              <circle className="train train-b" r="7">
                <animateMotion dur="2.8s" begin="1.6s" repeatCount="indefinite" path={s.pathB} keyPoints="0;1;1" keyTimes="0;.8;1" calcMode="linear" />
              </circle>
            </>
          )}

          {/* 起點 */}
          <circle className="term term-a" cx={s.a.x} cy={s.a.y} r="12" />
          <circle className="term term-b" cx={s.b.x} cy={s.b.y} r="12" />
          <g className="place">
            <text x={s.a.x} y={s.a.y - 24} textAnchor="middle">{n(s.a)}</text>
            <text x={s.b.x} y={s.b.y - 24} textAnchor="middle">{n(s.b)}</text>
          </g>

          {/* 通勤分鐘數 */}
          <g className="mins">
            <text className="min-a" x={s.labelA[0]} y={s.labelA[1]} textAnchor="middle">
              {nameA} {s.minA}{L(" 分", "′")}
            </text>
            <text className="min-b" x={s.labelB[0]} y={s.labelB[1]} textAnchor="middle">
              {nameB} {s.minB}{L(" 分", "′")}
            </text>
          </g>

          {/* 中間點：脈衝＋車站 */}
          {!still && <circle className="pulse" cx={s.mid.x} cy={s.mid.y} r="20" />}
          {!still && <circle className="pulse p2" cx={s.mid.x} cy={s.mid.y} r="20" />}
          <circle className="hub" cx={s.mid.x} cy={s.mid.y} r="20" />

          {/* 說明卡 */}
          <g className="card" transform={`translate(${s.card[0]} ${s.card[1]})`}>
            <rect width={cardW} height="70" rx="14" />
            <text className="c-name" x="18" y="30">{n(s.mid)}</text>
            <text className="c-note" x="18" y="53">
              {L(`兩人通勤只差 ${diff} 分鐘`, `Only ${diff} min apart`)}
            </text>
          </g>
        </g>
      </svg>

      <div className="scenarios" role="tablist" aria-label={L("範例情境", "Examples")}>
        {SCENARIOS.map((x, k) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={k === i}
            onClick={() => {
              setI(k);
              setAuto(false);
            }}
          >
            <i className="sa" />
            {n(x.a)}
            <span>×</span>
            <i className="sb" />
            {n(x.b)}
            {k === i && auto && !still && <b className="timer" key={`${x.id}-t`} />}
          </button>
        ))}
      </div>
    </div>
  );
}
