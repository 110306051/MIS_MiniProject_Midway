"use client";

import { useEffect, useState } from "react";
import type { ListingView, SearchInput, Weights } from "@/lib/types";
import { useL } from "../site/LocaleProvider";
import ListingCard from "./ListingCard";

/** 跨區房源排行：所有預算內（含彈性）的房源一起比較 */
export default function TopListings({
  searchId, input, weights, includeCost, flex, onPick, onListings,
}: {
  searchId: string;
  input: SearchInput;
  weights: Weights;
  includeCost: boolean;
  flex: number;
  onPick: (l: ListingView[]) => void;
  onListings: (pointId: string) => void;
}) {
  const { L, locale } = useL();
  const [data, setData] = useState<{ total: number; listings: ListingView[] } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const q = `w=${weights.f},${weights.s},${weights.r},${weights.p}&cost=${includeCost ? 1 : 0}&flex=${flex}`;
        const res = await fetch(`/api/searches/${searchId}/listings?${q}`, { signal: ctrl.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
        setError("");
        onPick(json.listings.slice(0, 10));
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message || L("載入失敗", "Could not load"));
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
      onPick([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchId, weights, includeCost, flex, locale]);

  if (error) return <p className="form-error">{error}</p>;
  if (!data) return <>{[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}</>;

  const near = data.listings.filter((l) => l.priceStatus === "near").length;
  return (
    <>
      <p className="hint">
        {L(
          `所有兩人通勤都在上限內、租金在預算${flex ? `＋${flex.toLocaleString()}` : ""}以內的房源，共 ${data.total} 間，依你們的權重排名（顯示前 ${data.listings.length} 間）。`,
          `${data.total} homes where both commutes are within limits and rent is within budget${flex ? ` + ${flex.toLocaleString()}` : ""}, ranked by your weights (top ${data.listings.length} shown). `
        )}
        {flex > 0 && near > 0 && L(" 橘色標籤是略超預算的房源。", "Orange tags mark homes slightly over budget. ")}
        {L(
          "地圖上的小圓點是前 10 名的位置。通勤以「區域通勤＋步行到站差」估算，點進單一區域可看逐筆計算。",
          "Small dots on the map are the top 10. Commutes are estimated from the area commute plus walking time; open an area for per-home figures."
        )}
      </p>
      {data.listings.length === 0 && <div className="empty"><h3>{L("沒有符合條件的房源", "No homes match")}</h3><p>{L("試著放寬通勤上限、提高預算，或打開預算彈性。", "Try a longer commute limit, a higher budget, or some budget flex.")}</p></div>}
      {data.listings.map((l, i) => (
        <ListingCard key={l.id} l={l} input={input} rank={i + 1} showArea onClick={() => onListings(l.pointId)} />
      ))}
    </>
  );
}
