"use client";

/** Google 地圖（金鑰：NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY） */
import { AdvancedMarker, APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import { COLOR_A, COLOR_B, type MapProps, type MapPoint } from "./types";

function Lines({ from, to }: { from: MapPoint | undefined; to: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !from) return;
    const lines = to.map(
      (w, i) =>
        new google.maps.Polyline({
          map,
          path: [{ lat: from.lat, lng: from.lng }, { lat: w.lat, lng: w.lng }],
          strokeOpacity: 0,
          icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 0.9, strokeColor: i ? COLOR_B : COLOR_A, scale: 3 }, offset: "0", repeat: "14px" }],
        })
    );
    return () => lines.forEach((l) => l.setMap(null));
  }, [map, from, to]);
  return null;
}

function Fit({ pts }: { pts: { lat: number; lng: number }[] }) {
  const map = useMap();
  const key = JSON.stringify(pts);
  useEffect(() => {
    if (!map || !pts.length) return;
    const b = new google.maps.LatLngBounds();
    pts.forEach((p) => b.extend(p));
    map.fitBounds(b, 48);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

export default function GoogleMap({ workplaces, picks, others, listings, selectedId, onSelect, apiKey, mapId, focusListings }: MapProps) {
  const sel = picks.find((p) => p.id === selectedId) ?? others.find((p) => p.id === selectedId);
  const fitPts = focusListings && listings.length ? listings : [...workplaces, ...picks];

  return (
    <APIProvider apiKey={apiKey!} language="zh-TW" region="TW">
      <Map mapId={mapId} defaultCenter={{ lat: 25.03, lng: 121.4 }} defaultZoom={10} gestureHandling="cooperative" disableDefaultUI zoomControl style={{ height: "100%" }}>
        <Fit pts={fitPts} />
        <Lines from={sel} to={workplaces} />

        {others.map((o) => (
          <AdvancedMarker key={o.id} position={o} title={`${o.name}：${o.note}`} onClick={() => onSelect(o.id)}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#d9d4ca", border: "1px solid #9a9488" }} />
          </AdvancedMarker>
        ))}

        {picks.map((p) => (
          <AdvancedMarker key={p.id} position={p} title={p.tooltip} zIndex={p.id === selectedId ? 1000 : 500} onClick={() => onSelect(p.id)}>
            <div className={`pin ${p.id === selectedId ? "pin-sel" : ""}`}>{p.rank}</div>
          </AdvancedMarker>
        ))}

        {listings.map((l) => (
          <AdvancedMarker key={l.id} position={l} title={l.name} zIndex={1500}>
            <div className={`lpin ${l.top ? "top" : ""}`} />
          </AdvancedMarker>
        ))}

        {workplaces.map((w, i) => (
          <AdvancedMarker key={w.id} position={w} title={`${w.label}的工作地：${w.name}`} zIndex={2000}>
            <div className={`wpin gm-wpin ${i ? "wpin-b" : "wpin-a"}`}>
              <span>{w.label}</span>
            </div>
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}
