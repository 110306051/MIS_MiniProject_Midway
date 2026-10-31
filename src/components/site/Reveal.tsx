"use client";

import { useEffect, useRef, useState } from "react";

/** 捲動到畫面內時加上 .in，讓區塊淡入、路線畫出來（只觸發一次） */
export default function Reveal({ as: Tag = "div", className = "", children }: { as?: "div" | "section" | "ol" | "ul"; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setSeen(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const T = Tag as any;
  return (
    <T ref={ref} className={`reveal ${seen ? "in" : ""} ${className}`}>
      {children}
    </T>
  );
}
