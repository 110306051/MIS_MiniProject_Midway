import type { Features } from "../types";
import { hasGoogleServer } from "./google";
import { hasLLM } from "./llm";

/** 依環境變數決定啟用哪些功能，傳給前端 */
export function getFeatures(): Features {
  return {
    googleServer: hasGoogleServer(),
    mapsBrowserKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY || null,
    mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID",
    llm: hasLLM(),
  };
}
