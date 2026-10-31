"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AMENITIES, FLEX_OPTIONS, MODES, ROOM_TYPES, type AmenityId, type Mode, type RoomType } from "@/lib/constants";
import { useL } from "./site/LocaleProvider";
import type { Features, Person, SearchInput, Workplace } from "@/lib/types";
import WorkplacePicker, { type Preset } from "./WorkplacePicker";

type Draft = Omit<Person, "workplace"> & { workplace: Workplace | null };

const emptyPerson = (): Draft => ({ name: "", workplace: null, mode: "transit", days: 5, max: 60 });

export default function SearchForm({ presets, features, initial, initialFlex = 0 }: { presets: Preset[]; features: Features; initial: SearchInput | null; initialFlex?: number }) {
  const router = useRouter();
  const { L, locale } = useL();
  const [people, setPeople] = useState<[Draft, Draft]>(initial ? [initial.people[0], initial.people[1]] : [emptyPerson(), emptyPerson()]);
  const [room, setRoom] = useState<RoomType>(initial?.room ?? "2r");
  const [budget, setBudget] = useState<number>(initial?.budget ?? 25000);
  const [splitA, setSplitA] = useState(initial?.splitA ?? 50);
  const [prefs, setPrefs] = useState<AmenityId[]>(initial?.prefs ?? []);
  const [flex, setFlex] = useState(initialFlex);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const setPerson = (i: 0 | 1, patch: Partial<Draft>) => {
    setPeople((ps) => {
      const next = [...ps] as [Draft, Draft];
      next[i] = { ...next[i], ...patch };
      return next;
    });
    setError("");
  };

  function fillDemo() {
    const find = (id: string) => presets.find((p) => p.id === id)!;
    const wp = (p: Preset): Workplace => ({ label: p.name, lat: p.lat, lng: p.lng, presetId: p.id });
    setPeople([
      { name: L("小明", "Alex"), workplace: wp(find("qingpu-hsr")), mode: "transit", days: 5, max: 60 },
      { name: L("小華", "Sam"), workplace: wp(find("xinyi")), mode: "transit", days: 5, max: 60 },
    ]);
    setRoom("2r");
    setBudget(25000);
    setSplitA(50);
    setPrefs(["shop", "pet"]);
    setFlex(0);
    setFormKey((k) => k + 1);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const names = [L("第一個人", "the first person"), L("第二個人", "the second person")];
    for (const i of [0, 1] as const) {
      if (!people[i].workplace) return setError(L(`請選擇${names[i]}的工作地。`, `Choose a workplace for ${names[i]}.`));
    }
    if (!budget || budget < 3000) return setError(L("請輸入每月租金總預算（至少 3,000 元）。", "Enter a total monthly rent budget (at least NT$3,000)."));
    const body: SearchInput = {
      people: people.map((p, i) => ({ ...p, name: p.name.trim() || (i === 0 ? "A" : "B"), workplace: p.workplace! })) as [Person, Person],
      room, budget, splitA, prefs,
    };
    if (body.people[0].name === body.people[1].name) body.people[1].name += "2";
    setBusy(true);
    try {
      const res = await fetch("/api/searches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, budgetFlex: flex }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? L("建立搜尋失敗", "Could not create the search"));
      router.push(`/s/${json.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const nameA = people[0].name.trim() || L("第一人", "Person 1");
  const nameB = people[1].name.trim() || L("第二人", "Person 2");

  return (
    <>
      <button type="button" className="link-btn" onClick={fillDemo}>
        {L("帶入範例：小明在青埔、小華在信義區", "Try an example: Alex in Qingpu, Sam in Xinyi")}
      </button>
      <form className="form-card" onSubmit={submit} noValidate key={formKey}>
        {!features.googleServer && (
          <p className="mode-note">
            {L("目前為", "Running in ")}<b>{L("估算模式", "estimate mode")}</b>
            {L("：尚未設定 Google Maps 金鑰，工作地只能從常見地點選擇，通勤時間為模型估算。設定方式見 README。", ": no Google Maps key is set, so workplaces come from a preset list and commute times are modelled. See the README to set one up.")}
          </p>
        )}
        <div className="people">
          {([0, 1] as const).map((i) => (
            <fieldset key={i} className={`person ${i ? "person-b" : "person-a"}`}>
              <legend>
                <span className={`dot ${i ? "dot-b" : "dot-a"}`} />
                {i ? L("第二個人", "Second person") : L("第一個人", "First person")}
              </legend>
              <label>
                {L("稱呼", "Name")}
                <input value={people[i].name} maxLength={12} placeholder={i ? L("小華", "Sam") : L("小明", "Alex")} onChange={(e) => setPerson(i, { name: e.target.value })} />
              </label>
              <WorkplacePicker value={people[i].workplace} onChange={(w) => setPerson(i, { workplace: w })} presets={presets} google={features.googleServer} />
              <div className="two">
                <label>
                  {L("通勤方式", "Gets there by")}
                  <select value={people[i].mode} onChange={(e) => setPerson(i, { mode: e.target.value as Mode })}>
                    {MODES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m[locale]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {L("每週進辦公室", "Office days / week")}
                  <select value={people[i].days} onChange={(e) => setPerson(i, { days: +e.target.value })}>
                    {[1, 2, 3, 4, 5].map((d) => (
                      <option key={d} value={d}>
                        {L(`${d} 天`, `${d} day${d > 1 ? "s" : ""}`)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="range-label">
                {L("最長可接受單程通勤", "Longest one-way commute")} <output>{L(`${people[i].max} 分鐘`, `${people[i].max} min`)}</output>
                <input type="range" min={20} max={90} step={5} value={people[i].max} onChange={(e) => setPerson(i, { max: +e.target.value })} />
              </label>
            </fieldset>
          ))}
        </div>

        <fieldset className="shared">
          <legend>{L("一起住的條件", "Living together")}</legend>
          <div className="three">
            <label>
              {L("房型", "Home type")}
              <select value={room} onChange={(e) => setRoom(e.target.value as RoomType)}>
                {ROOM_TYPES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r[locale]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {L("每月租金總預算（元）", "Total monthly rent (NT$)")}
              <input type="number" inputMode="numeric" min={3000} step={1000} value={budget || ""} onChange={(e) => (setBudget(+e.target.value), setError(""))} />
            </label>
            <label className="range-label">
              {L("租金分攤", "Rent split")}{" "}
              <output>
                {nameA} {splitA}%・{nameB} {100 - splitA}%
              </output>
              <input type="range" min={20} max={80} step={5} value={splitA} onChange={(e) => setSplitA(+e.target.value)} />
            </label>
          </div>
          <div className="flex-row">
            <span className="pref-label">{L("願意略超預算嗎？", "Stretch the budget a little?")}</span>
            <div className="seg-control" role="radiogroup" aria-label={L("預算彈性", "Budget flex")}>
              {FLEX_OPTIONS.map((f) => (
                <button key={f} type="button" role="radio" aria-checked={flex === f} className={flex === f ? "on" : ""} onClick={() => setFlex(f)}>
                  {f ? `+${f.toLocaleString()}` : L("不超過", "No")}
                </button>
              ))}
            </div>
            <small className="hint">{L("略超預算的房源會納入，並特別標示。之後在結果頁也能調整。", "Homes slightly over budget get included and flagged. You can change this on the results page too.")}</small>
          </div>
          <div className="pref-label">{L("在意的生活機能（可複選）", "What you want nearby (pick any)")}</div>
          <div className="chips">
            {AMENITIES.map((a) => (
              <label className="chip" key={a.id}>
                <input
                  type="checkbox"
                  checked={prefs.includes(a.id)}
                  onChange={(e) => setPrefs((p) => (e.target.checked ? [...p, a.id] : p.filter((x) => x !== a.id)))}
                />
                <span>{a[locale]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <p className="form-error" role="alert">
          {error}
        </p>
        <button type="submit" className="primary-btn" disabled={busy}>
          {busy ? L("正在計算各地點的通勤時間…", "Timing commutes from every area…") : L("找出我們的中間點", "Find our midpoint")}
        </button>
      </form>
    </>
  );
}
