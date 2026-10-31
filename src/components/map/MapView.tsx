"use client";

import dynamic from "next/dynamic";
import type { MapProps } from "./types";

// 地圖套件只能在瀏覽器執行，所以關閉伺服器端渲染
const Loading = () => <div className="map-off" aria-busy="true" />;
const GoogleMap = dynamic(() => import("./GoogleMap"), { ssr: false, loading: Loading });
const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false, loading: Loading });

/** 有 Google 地圖金鑰就用 Google，否則用開源地圖 */
export default function MapView(props: MapProps) {
  return props.apiKey ? <GoogleMap {...props} /> : <LeafletMap {...props} />;
}
