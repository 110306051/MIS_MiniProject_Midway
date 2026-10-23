"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AMENITIES, FLEX_OPTIONS, MODES, PRESETS, ROOM_TYPES } from "@/lib/constants";
import { evaluate, normalizeWeights, recommend } from "@/lib/scoring";
import type { Features, ListingView, SearchRecord, VoteMap, Weights } from "@/lib/types";
import MapView from "./map/MapView";
import type { MapProps } from "./map/types";
import AllTable from "./results/AllTable";
import AreaCard, { WEIGHT_DEFS } from "./results/AreaCard";
import HowItWorks from "./results/HowItWorks";
import ListingsDrawer from "./results/ListingsDrawer";
import ChatPanel from "./results/ChatPanel";
import TopListings from "./results/TopListings";

type Tab = "rec" | "listings" | "chat" | "all" | "how";
const fmt = (n: number) => Math.round(n).toLocaleString("zh-TW");

export default function ResultsView({ search, initialVotes, features }: { search: SearchRecord; initialVotes: VoteMap; features: Features }) {
  const { input, metrics, id } = search;
  const [A, B] = input.people;

  const [weights, setWeights] = useState<Weights>(search.weights);
  const [includeCost, setIncludeCost] = useState(search.includeCost);
  const [flex, setFlex] = useState(search.budgetFlex ?? 0);
  const [rankPins, setRankPins] = useState<ListingView[]>([]);
  const [votes, setVotes] = useState<VoteMap>(initialVotes);
  const [tab, setTab] = useState<Tab>("rec");
  const [selected, setSelected] = useState<string | null>(null);
  const [me, setMe] = useState<0 | 1 | null>(null);
  const [toast, setToast] = useState("");
  const [drawerArea, setDrawerArea] = useState<string | null>(null);
  const [listings, setListings] = useState<ListingView[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  /* ---------- 計分（權重改變時在前端即時重算） ---------- */
  const scored = useMemo(() => evaluate(metrics.areas, input, weights, includeCost, flex), [metrics, input, weights, includeCost, flex]);
  const picks = useMemo(() => recommend(scored), [scored]);
  const selectedId = selected && scored.some((s) => s.pointId === selected) ? selected : picks[0]?.pointId ?? null;
  const w = normalizeWeights(weights);

  /* ---------- 權重存回資料庫（防抖 600ms） ---------- */
  const first = useRef(true);
  useEffect(() => {
    if (first.current) return void (first.current = false);
    const t = setTimeout(() => {
      fetch(`/api/searches/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weights, includeCost, budgetFlex: flex }) }).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [weights, includeCost, flex, id]);

  /* ---------- 我是誰（存在這台裝置） ---------- */
  useEffect(() => {
    try {
      const v = localStorage.getItem(`midway:me:${id}`);
      if (v === "0" || v === "1") setMe(+v as 0 | 1);
    } catch {}
  }, [id]);
  const chooseMe = (i: 0 | 1) => {
    setMe(i);
    try {
      localStorage.setItem(`midway:me:${id}`, String(i));
    } catch {}
  };

  /* ---------- 投票（每 5 秒同步對方的投票） ---------- */
  useEffect(() => {
    const t = setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/searches/${id}/votes`);
        if (res.ok) setVotes((await res.json()).votes);
      } catch {}
    }, 5000);
    return () => clearInterval(t);
  }, [id]);

  async function vote(pointId: string) {
    if (me === null) return;
    const cur = votes[pointId] ?? [false, false];
    const liked = !cur[me];
    const next: [boolean, boolean] = [...cur] as [boolean, boolean];
    next[me] = liked;
    setVotes((v) => ({ ...v, [pointId]: next }));
    const res = await fetch(`/api/searches/${id}/votes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pointId, person: me, liked }) });
    if (res.ok) setVotes((await res.json()).votes);
  }

  /* ---------- 區域房源 ---------- */
  const openListings = useCallback(
    async (pointId: string) => {
      setDrawerArea(pointId);
      setSelected(pointId);
      setListLoading(true);
      setListError("");
      setListings([]);
      try {
        const q = `w=${weights.f},${weights.s},${weights.r},${weights.p}&cost=${includeCost ? 1 : 0}&flex=${flex}`;
        const res = await fetch(`/api/searches/${id}/areas/${pointId}/listings?${q}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setListings(json.listings);
      } catch (e) {
        setListError((e as Error).message || "房源載入失敗");
      } finally {
        setListLoading(false);
      }
    },
    [id, weights, includeCost, flex]
  );
  const closeDrawer = useCallback(() => {
    setDrawerArea(null);
    setListings([]);
  }, []);

  async function askAI(pointId: string) {
    const res = await fetch(`/api/searches/${id}/explain`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pointId, weights, includeCost, budgetFlex: flex }) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json as { lines: string[]; source: string };
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast("已複製連結，傳給對方就能一起看、一起投票");
    } catch {
      setToast("請手動複製網址列的連結");
    }
    setTimeout(() => setToast(""), 3000);
  }

  /* ---------- 地圖資料 ---------- */
  const mapWorkplaces = useMemo(
    () =>
      [
        { id: "wa", name: A.workplace.label, label: A.name, lat: A.workplace.lat, lng: A.workplace.lng },
        { id: "wb", name: B.workplace.label, label: B.name, lat: B.workplace.lat, lng: B.workplace.lng },
      ] as MapProps["workplaces"],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input]
  );
  const mapPicks = useMemo(
    () => picks.map((p, i) => ({ id: p.pointId, name: p.name, lat: p.lat, lng: p.lng, rank: i + 1, tooltip: `${i + 1}. ${p.name}｜${A.name} ${p.commute[0].min} 分・${B.name} ${p.commute[1].min} 分` })),
    [picks, A.name, B.name]
  );
  const mapOthers = useMemo(() => {
    const ids = new Set(picks.map((p) => p.pointId));
    return scored.filter((s) => !ids.has(s.pointId)).map((s) => ({ id: s.pointId, name: s.name, lat: s.lat, lng: s.lng, note: s.eligible ? "符合但未進前五" : s.reasons[0] }));
  }, [scored, picks]);
  // 地圖上的房源點：打開區域時顯示該區房源；在「房源排行」分頁時顯示前 10 名
  const pinSource = drawerArea ? listings : tab === "listings" ? rankPins : [];
  const mapListings = useMemo(() => pinSource.map((l, i) => ({ id: l.id, name: `${l.areaName}・${l.title}｜${fmt(l.rent)} 元`, lat: l.lat, lng: l.lng, top: i === 0 })), [pinSource]);

  // AI 顧問的建議問題：依這次的結果挑出最值得問的
  const suggestions = useMemo(() => {
    const out: string[] = [];
    const commuteOk = (r: (typeof scored)[number]) => r.commute[0].min <= A.max && r.commute[1].min <= B.max;
    const blocked = scored.filter((r) => !r.eligible && commuteOk(r))[0];
    const pricey = picks.find((p) => p.supply.pricey);
    if (blocked) out.push(`為什麼${blocked.name}沒有被推薦？`);
    if (pricey) out.push(`${pricey.name}行情偏高，預算內的房子有什麼缺點？`);
    if (picks[0]) out.push(`第一名${picks[0].name}對誰比較不公平？`);
    out.push(flex < 3000 ? `如果我們願意多付 ${(flex + 2000).toLocaleString()} 元，會多出哪些選擇？` : "哪一區預算內的選擇最多？");
    return out;
  }, [scored, picks, flex, A.max, B.max]);

  const prefs = input.prefs.map((p) => AMENITIES.find((a) => a.id === p)?.name).join("、") || "未指定";
  const modeName = (m: string) => MODES.find((x) => x.id === m)?.name;
  const drawerPick = drawerArea ? scored.find((s) => s.pointId === drawerArea) ?? null : null;

  return (
    <main className="results">
      <aside className="sidebar">
        <div className="summary">
          {input.people.map((p, i) => (
            <div className={`who ${i ? "who-b" : "who-a"}`} key={i}>
              <span className={`dot ${i ? "dot-b" : "dot-a"}`} />
              <div>
                <b>{p.name}</b>
                <span>
                  {p.workplace.label}・{modeName(p.mode)}・週 {p.days} 天・≤ {p.max} 分
                </span>
              </div>
            </div>
          ))}
          <div className="who-meta">
            {ROOM_TYPES.find((r) => r.id === input.room)?.name}・預算 {fmt(input.budget)} 元・分攤 {input.splitA}/{100 - input.splitA}
            <br />
            偏好：{prefs}
            <br />
            通勤資料：
            <span className={`source-badge ${metrics.commuteSource === "estimate" ? "est" : ""}`}>
              {metrics.commuteSource === "estimate" ? "估算模式" : metrics.commuteSource === "google" ? "Google 尖峰時段" : "Google＋估算"}
            </span>
          </div>
        </div>
        <Link className="ghost-btn center" href={`/search?from=${id}`}>
          修改條件（建立新搜尋）
        </Link>

        <div className="panel">
          <h3>預算彈性</h3>
          <p className="hint">預算 {fmt(input.budget)} 元。願意多付一點的話，略超預算的房源也會納入，並以橘色標示。</p>
          <div className="seg-control" role="radiogroup" aria-label="預算彈性">
            {FLEX_OPTIONS.map((f) => (
              <button key={f} type="button" role="radio" aria-checked={flex === f} className={flex === f ? "on" : ""} onClick={() => setFlex(f)}>
                {f ? `+${fmt(f)}` : "不超過"}
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>你們比較在乎什麼？</h3>
          <p className="hint">拖動權重，推薦會即時重算，並同步給對方。</p>
          <div className="presets">
            {PRESETS.map((p) => (
              <button key={p.name} type="button" className={`preset ${WEIGHT_DEFS.every((d) => p.w[d.key] === weights[d.key]) ? "on" : ""}`} onClick={() => setWeights({ ...p.w })}>
                {p.name}
              </button>
            ))}
          </div>
          {WEIGHT_DEFS.map((d) => (
            <div className="weight" key={d.key}>
              <div className="weight-top">
                <span className={`wdot w-${d.key}`} />
                <b>{d.name}</b>
                <output>{Math.round(w[d.key] * 100)}%</output>
              </div>
              <input id={`w-${d.key}`} type="range" min={0} max={10} step={1} value={weights[d.key]} aria-label={`${d.name}權重`} onChange={(e) => setWeights((x) => ({ ...x, [d.key]: +e.target.value }))} />
              <small>{d.desc}</small>
            </div>
          ))}
          <label className="check">
            <input type="checkbox" checked={includeCost} onChange={(e) => setIncludeCost(e.target.checked)} /> 成本也計入每月交通費
          </label>
        </div>

        <div className="panel">
          <h3>一起決定</h3>
          <p className="hint">選擇你是誰，就能替喜歡的地點按愛心。對方的投票每 5 秒同步。</p>
          <div className="me-row">
            {input.people.map((p, i) => (
              <button key={i} type="button" className={me === i ? (i ? "on-b" : "on-a") : ""} onClick={() => chooseMe(i as 0 | 1)}>
                我是{p.name}
              </button>
            ))}
          </div>
          <button type="button" className="ghost-btn" style={{ width: "100%", marginTop: 10 }} onClick={share}>
            複製分享連結
          </button>
          <span className="toast" role="status">
            {toast}
          </span>
        </div>
      </aside>

      <section className="main">
        <div className="map-wrap">
          <div id="map">
            <MapView
              workplaces={mapWorkplaces}
              picks={mapPicks}
              others={mapOthers}
              listings={mapListings}
              focusListings={!!drawerArea}
              selectedId={selectedId}
              onSelect={(pid) => {
                setSelected(pid);
                if (tab === "rec") document.getElementById(`card-${pid}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              apiKey={features.mapsBrowserKey ?? undefined}
              mapId={features.mapId}
            />
          </div>
          <div className="map-legend">
            <span><i className="lg lg-a" /><b>{A.name}</b> 工作地</span>
            <span><i className="lg lg-b" /><b>{B.name}</b> 工作地</span>
            <span><i className="lg lg-pick" />推薦地點</span>
            <span><i className="lg lg-out" />其他候選地點</span>
          </div>
        </div>

        <nav className="tabs" role="tablist">
          {(
            [
              ["rec", "推薦地區"],
              ["listings", "房源排行"],
              ["chat", "AI 顧問"],
              ["all", "所有地區比較"],
              ["how", "怎麼算的"],
            ] as [Tab, string][]
          ).map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </nav>

        {tab === "rec" &&
          (picks.length ? (
            <div className="route-list">
            {picks.map((r, i) => (
              <div id={`card-${r.pointId}`} key={r.pointId}>
                <AreaCard
                  r={r}
                  rank={i + 1}
                  top={picks[0]}
                  input={input}
                  includeCost={includeCost}
                  selected={selectedId === r.pointId}
                  vote={votes[r.pointId] ?? [false, false]}
                  me={me}
                  llm={features.llm}
                  onSelect={() => setSelected(r.pointId)}
                  onVote={() => vote(r.pointId)}
                  onListings={() => openListings(r.pointId)}
                  onAskAI={() => askAI(r.pointId)}
                />
              </div>
            ))}
            </div>
          ) : (
            <div className="empty">
              <h3>目前沒有地點同時符合兩人的通勤上限與預算</h3>
              <p>試著把最長通勤時間放寬 10 分鐘、提高預算，或改選套房。「所有地點比較」可以看到每個地點被排除的原因。</p>
              <button type="button" className="ghost-btn" onClick={() => setTab("all")}>
                看所有地點
              </button>
            </div>
          ))}
        {tab === "listings" && (
          <TopListings searchId={id} input={input} weights={weights} includeCost={includeCost} flex={flex} onPick={setRankPins} onListings={openListings} />
        )}
        {tab === "chat" && <ChatPanel searchId={id} weights={weights} includeCost={includeCost} flex={flex} llm={features.llm} suggestions={suggestions} />}
        {tab === "all" && <AllTable scored={scored} picks={picks} input={input} selectedId={selectedId} onSelect={setSelected} />}
        {tab === "how" && <HowItWorks source={metrics.commuteSource} />}
      </section>

      <ListingsDrawer area={drawerPick} input={input} flex={flex} listings={listings} loading={listLoading} error={listError} onClose={closeDrawer} />
    </main>
  );
}

