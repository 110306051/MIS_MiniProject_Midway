"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cityName, workplaceName } from "@/lib/constants";
import type { Workplace } from "@/lib/types";
import { useL } from "./site/LocaleProvider";

export type Preset = { id: string; name: string; city: string; lat: number; lng: number; lines: string[] };
type Suggestion = { placeId: string; main: string; secondary: string };

const presetToWorkplace = (p: Preset): Workplace => ({ label: p.name, lat: p.lat, lng: p.lng, presetId: p.id });
const newSession = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));

/**
 * 工作地選擇：
 * - 有 Google 金鑰 → 輸入任何地址或公司名稱（Places 自動完成，經由後端代理）
 * - 沒有金鑰 → 從常見工作地選單選擇
 */
export default function WorkplacePicker({
  value, onChange, presets, google,
}: { value: Workplace | null; onChange: (w: Workplace) => void; presets: Preset[]; google: boolean }) {
  const listId = useId();
  const { L, locale } = useL();
  const pname = (p: Preset) => workplaceName({ label: p.name, presetId: p.id }, locale);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState("");
  const session = useRef(newSession());

  useEffect(() => {
    if (!google || q.trim().length < 2) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(q)}&session=${session.current}`, { signal: ctrl.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setItems(json.suggestions);
        setActive(0);
        setOpen(true);
        setError("");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError(L("地址搜尋暫時無法使用，請改選常見地點", "Address search is unavailable right now — pick a common place instead"));
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, google]);

  async function pick(s: Suggestion) {
    setOpen(false);
    setQ(s.main);
    try {
      const res = await fetch(`/api/places/details?id=${encodeURIComponent(s.placeId)}&session=${session.current}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      onChange({ label: s.main, lat: d.lat, lng: d.lng, placeId: d.placeId });
      session.current = newSession(); // 一次選取結束，計費 session 重新開始
    } catch {
      setError(L("無法取得這個地點的座標，請換一個試試", "Couldn't locate that place — try another"));
    }
  }

  return (
    <div className="wp-picker">
      {google ? (
        <label>
          {L("工作地（地址或公司名稱）", "Workplace (address or company)")}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => items.length && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (!open || !items.length) return;
              if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(a + 1, items.length - 1)));
              if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)));
              if (e.key === "Enter") (e.preventDefault(), pick(items[active]));
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder={L("例如：台北 101、桃園高鐵站", "e.g. Taipei 101, HSR Taoyuan")}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
          />
        </label>
      ) : (
        <label>
          {L("工作地", "Workplace")}
          <select
            value={value?.presetId ?? ""}
            onChange={(e) => {
              const p = presets.find((x) => x.id === e.target.value);
              if (p) onChange(presetToWorkplace(p));
            }}
          >
            <option value="" disabled>
              {L("請選擇", "Choose one")}
            </option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {cityName(p.city, locale)}{L("・", " · ")}{pname(p)}
              </option>
            ))}
          </select>
        </label>
      )}

      {open && items.length > 0 && (
        <ul className="suggest" id={listId} role="listbox">
          {items.map((s, i) => (
            <li key={s.placeId} role="option" aria-selected={i === active} onMouseDown={() => pick(s)}>
              {s.main}
              <small>{s.secondary}</small>
            </li>
          ))}
        </ul>
      )}

      {google && (
        <div className="preset-row" aria-label={L("常見工作地", "Common workplaces")}>
          {presets.slice(0, 8).map((p) => (
            <button
              type="button"
              key={p.id}
              className={value?.presetId === p.id ? "on" : ""}
              onClick={() => {
                setQ(pname(p));
                onChange(presetToWorkplace(p));
              }}
            >
              {pname(p)}
            </button>
          ))}
        </div>
      )}
      {google && value && (
        <div className="wp-current">
          {L("已選擇：", "Selected: ")}<b>{workplaceName(value, locale)}</b>
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
