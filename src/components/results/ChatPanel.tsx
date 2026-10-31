"use client";

import { useEffect, useRef, useState } from "react";
import type { Weights } from "@/lib/types";
import { useL } from "../site/LocaleProvider";

type Msg = { role: "user" | "assistant"; content: string };

/** AI 顧問：開場顯示規則洞察；設定 ANTHROPIC_API_KEY 後可以自由提問 */
export default function ChatPanel({
  searchId, weights, includeCost, flex, llm, suggestions,
}: { searchId: string; weights: Weights; includeCost: boolean; flex: number; llm: boolean; suggestions: string[] }) {
  const { L, locale } = useL();
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
  }, [searchId, weights, includeCost, flex, locale]);

  // 用大括號包起來：新版瀏覽器的 scrollIntoView 會回傳 Promise，直接回傳會讓 React 報錯
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);

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
      setError((e as Error).message || L("AI 暫時無法回覆", "The AI couldn't reply"));
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
          <span className="ai-badge">{L("重點整理", "Key points")}</span>
          <small>{L("依目前的權重與預算彈性即時計算", "Worked out live from your weights and budget flex")}</small>
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
          {L("AI 對話需要在 ", "AI chat needs ")}<code>ANTHROPIC_API_KEY</code>{L(" 設定在 ", " set in ")}<code>.env</code>
          {L("。設定後重新啟動，就能直接問「為什麼南港沒被推薦？」這類問題。", ". Restart after setting it and you can ask things like “Why isn’t Nangang recommended?”")}
        </p>
      )}

      {llm && (
        <>
          <div className="chat-log">
            {messages.length === 0 && <p className="hint">{L("可以問任何關於這次推薦的問題，AI 只會根據你們的條件與資料回答。", "Ask anything about these results. The AI only answers from your conditions and the data.")}</p>}
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                {m.content}
              </div>
            ))}
            {busy && <div className="bubble assistant typing">{L("AI 思考中…", "Thinking…")}</div>}
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
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={L("例如：如果我們願意多付 2,000，會多出哪些選擇？", "e.g. What opens up if we pay NT$2,000 more?")} maxLength={500} aria-label={L("問 AI 顧問", "Ask the AI advisor")} />
            <button type="submit" className="primary-btn sm" disabled={busy || !text.trim()}>
              {L("送出", "Send")}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
