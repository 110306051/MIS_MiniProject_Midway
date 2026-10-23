"use client";

import { useEffect } from "react";
import type { Scored } from "@/lib/scoring";
import type { ListingView, SearchInput } from "@/lib/types";
import ListingCard from "./ListingCard";

const fmt = (n: number) => Math.round(n).toLocaleString("zh-TW");

export default function ListingsDrawer({
  area, input, flex, listings, loading, error, onClose,
}: { area: Scored | null; input: SearchInput; flex: number; listings: ListingView[]; loading: boolean; error: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const open = !!area;
  const source = listings[0]?.commute[0].source;
  const s = area?.supply;

  return (
    <>
      {open && <div className="drawer-backdrop" onClick={onClose} />}
      <aside className={`drawer ${open ? "open" : ""}`} aria-hidden={!open} aria-label="區域房源">
        {area && s && (
          <>
            <div className="drawer-head">
              <h2>{area.name}・房源</h2>
              <button type="button" className="icon-btn" onClick={onClose} aria-label="關閉">
                ✕
              </button>
            </div>

            <div className="supply-box">
              <div><small>該區行情</small><b>{fmt(s.market)}</b></div>
              <div><small>預算內</small><b>{s.inBudget} 間</b></div>
              {flex > 0 && <div><small>略超 ≤ {fmt(flex)}</small><b>{s.near} 間</b></div>}
              <div><small>房源總數</small><b>{s.total} 間</b></div>
            </div>
            {s.pricey && (
              <p className="supply-note">
                這區行情高於你們的預算，預算內的房子通常有些取捨，下方以橘色標出（例如屋齡較舊、坪數較小、離站較遠）。
              </p>
            )}

            <div className="drawer-tools">
              <span>依你們的權重排序：預算內 → 略超預算 → 超出預算</span>
              {source && <span className={`source-badge ${source === "google" ? "" : "est"}`}>{source === "google" ? "逐筆 Google 通勤" : "通勤為估算"}</span>}
            </div>

            {loading && [0, 1, 2].map((i) => <div key={i} className="skeleton" />)}
            {error && <p className="form-error">{error}</p>}
            {!loading && listings.map((l) => <ListingCard key={l.id} l={l} input={input} />)}

            <a className="primary-btn block" href="https://rent.591.com.tw/" target="_blank" rel="noopener noreferrer">
              前往 591 搜尋「{area.name}」房源 ↗
            </a>
            <p className="hint center">房源為模擬資料；正式版需與租屋平台合作取得。</p>
          </>
        )}
      </aside>
    </>
  );
}
