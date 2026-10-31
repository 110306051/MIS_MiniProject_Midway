"use client";

import { useEffect, useState } from "react";
import { COLOR_A, COLOR_B } from "./types";

/** 從目前配色讀出兩人的路線顏色；切換配色時會更新 */
export function useLineColors(): [string, string] {
  const [c, setC] = useState<[string, string]>([COLOR_A, COLOR_B]);
  useEffect(() => {
    const read = () => {
      const s = getComputedStyle(document.documentElement);
      setC([s.getPropertyValue("--a").trim() || COLOR_A, s.getPropertyValue("--b").trim() || COLOR_B]);
    };
    read();
    window.addEventListener("midway-theme", read);
    return () => window.removeEventListener("midway-theme", read);
  }, []);
  return c;
}
