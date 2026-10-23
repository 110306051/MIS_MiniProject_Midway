"use client";

import { useEffect, useRef, useState } from "react";
import type { Weights } from "@/lib/types";

type Msg = { role: "user" | "assistant"; content: string };

/** AI 顧問：開場顯示規則洞察；設定 ANTHROPIC_API_KEY 後可以自由提問 */
export default function ChatPanel({
  searchId, weights, includeCost, flex, llm, suggestions,
}: { searchId: string; weights: Weights; includeCost: boolean; flex: number; llm: boolean; suggestions: string[] }) {
  const [insights, setInsights] = useState<string[] | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const body = (msgs: Msg[]) => JSON.stringify({ weights, includeCost, budgetFlex: flex, messages: msgs });

  useEffect(() => {
    let alive = true;
    fetch(`/api/searches/${searchId}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: body([]) })
      .then((r) => r.json())
      .then((j) => alive && setInsights(j.insights ?? []))
      .catch(() => alive && setInsights([]));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchId, weights, includeCost, flex]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), [messages, busy]);

  async function send(q: string) {
    const content = q.trim();
    if (!content || busy) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setText("");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/searches/${searchId}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: body(next) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMessages([...next, { role: "assistant", content: json.reply }]);
    } catch (e) {
      setError((e as Error).message || "AI 暫時無法回覆");
      setMessages(messages); // 送出失敗就把問題放回輸入框
      setText(content);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chat">
      <div className="chat-insights">
        <div className="ai-head">
          <span className="ai-badge">重點整理</span>
          <small>依目前的權重與預算彈性即時計算</small>
        </div>
        {insights === null ? (
          <div className="skeleton" />
        ) : (
          <ul>
            {insights.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        )}
      </div>

      {!llm && (
        <p className="mode-note">
          AI 對話需要在 <code>.env</code> 設定 <code>ANTHROPIC_API_KEY</code>。設定後重新啟動，就能直接問「為什麼南港沒被推薦？」這類問題。
        </p>
      )}

      {llm && (
        <>
          <div className="chat-log">
            {messages.length === 0 && <p className="hint">可以問任何關於這次推薦的問題，AI 只會根據你們的條件與資料回答。</p>}
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                {m.content}
              </div>
            ))}
            {busy && <div className="bubble assistant typing">AI 思考中…</div>}
            <div ref={endRef} />
          </div>
          <div className="chat-suggest">
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => send(s)} disabled={busy}>
                {s}
              </button>
            ))}
          </div>
          {error && <p className="form-error">{error}</p>}
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
          >
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="例如：如果我們願意多付 2,000，會多出哪些選擇？" maxLength={500} aria-label="問 AI 顧問" />
            <button type="submit" className="primary-btn sm" disabled={busy || !text.trim()}>
              送出
            </button>
          </form>
        </>
      )}
    </div>
  );
}
