"use client";

/** 沒有 Google 地圖金鑰時使用的開源地圖（Leaflet + OpenStreetMap 底圖） */
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { COLOR_A, COLOR_B, type MapProps } from "./types";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function FitBounds({ pts }: { pts: [number, number][] }) {
  const map = useMap();
  const key = JSON.stringify(pts);
  useEffect(() => {
    if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

export default function LeafletMap({ workplaces, picks, others, listings, selectedId, onSelect, focusListings }: MapProps) {
  const sel = picks.find((p) => p.id === selectedId) ?? others.find((p) => p.id === selectedId);
  const bounds = useMemo<[number, number][]>(
    () => (focusListings && listings.length ? listings.map((l) => [l.lat, l.lng]) : [...workplaces, ...picks].map((p) => [p.lat, p.lng])),
    [workplaces, picks, listings, focusListings]
  );

  return (
    <MapContainer center={[25.03, 121.4]} zoom={10} scrollWheelZoom={false} style={{ height: "100%" }}>
      {/* OpenStreetMap 官方圖磚：免金鑰，適合開發與小流量；正式上線建議改用 Google 地圖 */}
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <FitBounds pts={bounds} />

      {others.map((o) => (
        <CircleMarker key={o.id} center={[o.lat, o.lng]} radius={5} pathOptions={{ color: "#9a9488", weight: 1, fillColor: "#d9d4ca", fillOpacity: 0.9 }} eventHandlers={{ click: () => onSelect(o.id) }}>
          <Tooltip>{`${o.name}：${o.note}`}</Tooltip>
        </CircleMarker>
      ))}

      {sel &&
        workplaces.map((w, i) => (
          <Polyline key={w.id} positions={[[sel.lat, sel.lng], [w.lat, w.lng]]} pathOptions={{ color: i ? COLOR_B : COLOR_A, weight: 3, dashArray: "6 6", opacity: 0.85 }} />
        ))}

      {picks.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          zIndexOffset={p.id === selectedId ? 1000 : 500}
          icon={L.divIcon({ className: "", html: `<div class="pin ${p.id === selectedId ? "pin-sel" : ""}">${p.rank}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] })}
          eventHandlers={{ click: () => onSelect(p.id) }}
        >
          <Tooltip>{p.tooltip}</Tooltip>
        </Marker>
      ))}

      {listings.map((l) => (
        <Marker key={l.id} position={[l.lat, l.lng]} zIndexOffset={1500} icon={L.divIcon({ className: "", html: `<div class="lpin ${l.top ? "top" : ""}"></div>`, iconSize: [12, 12], iconAnchor: [6, 6] })}>
          <Tooltip>{l.name}</Tooltip>
        </Marker>
      ))}

      {workplaces.map((w, i) => (
        <Marker key={w.id} position={[w.lat, w.lng]} zIndexOffset={2000} icon={L.divIcon({ className: "", html: `<div class="wpin ${i ? "wpin-b" : "wpin-a"}"><span>${esc(w.label)}</span></div>`, iconSize: [0, 0] })}>
          <Tooltip>{`${w.label}的工作地：${w.name}`}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
