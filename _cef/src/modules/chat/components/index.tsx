import { useEffect, useRef, useState } from "react";
import rpc from "rage-rpc";

import "./chat.css";

type Message = { text: string; id: string };
const COLOR_TOKEN = /!\{#([\da-fA-F]{6}|[\da-fA-F]{3})\}/g;

function renderColoredText(text: string) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let color = "#ffffff";
  let match: RegExpExecArray | null;
  COLOR_TOKEN.lastIndex = 0;
  while ((match = COLOR_TOKEN.exec(text))) {
    if (match.index > cursor) parts.push(<span key={`${cursor}-text`} style={{ color }}>{text.slice(cursor, match.index)}</span>);
    color = match[1].length === 3 ? `#${match[1].split("").map((c) => c + c).join("")}` : `#${match[1]}`;
    cursor = COLOR_TOKEN.lastIndex;
  }
  if (cursor < text.length) parts.push(<span key={`${cursor}-text`} style={{ color }}>{text.slice(cursor)}</span>);
  return parts;
}

export const Chat = () => {
  const [inputValue, setInputValue] = useState("");
  const [inputOpen, setInputOpen] = useState(false);
  const [dimmed, setDimmed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const events = mp.events;
    if (!events) return;
    const receiveMessage = (text: string) => {
      setMessages((prev) => [...prev, { text: String(text), id: `${Date.now()}-${Math.random()}` }].slice(-50));
      setDimmed(false);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      fadeTimer.current = setTimeout(() => setDimmed(true), 6000);
    };
    const changeInputState = (active: boolean) => setInputOpen(active);
    events.add("chat:push", receiveMessage);
    events.add("chat:active", changeInputState);
    return () => {
      events.remove("chat:push");
      events.remove("chat:active");
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, []);

  useEffect(() => { if (inputOpen) inputRef.current?.focus(); }, [inputOpen]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const closeInput = () => {
    setInputOpen(false);
    rpc.callClient("chat:close");
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (text) {
      if (text.startsWith("/") && text.length > 1) mp.invoke("command", text.substring(1));
      else void rpc.callServer("chat:send", text).catch(() => undefined);
      setHistory((prev) => [...prev.slice(-19), text]);
    }
    setHistoryIndex(-1);
    setInputValue("");
    closeInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); handleSend(); }
    else if (e.key === "Escape") { e.preventDefault(); setInputValue(""); closeInput(); }
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(historyIndex + 1, history.length - 1);
      if (next >= 0) { setInputValue(history[history.length - 1 - next]); setHistoryIndex(next); }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = historyIndex - 1;
      if (next >= 0) { setInputValue(history[history.length - 1 - next]); setHistoryIndex(next); }
      else { setInputValue(""); setHistoryIndex(-1); }
    }
  };

  return (
    <section className={`game-chat${inputOpen ? " game-chat--open" : ""}${dimmed && !inputOpen ? " game-chat--dimmed" : ""}`} aria-label="Игровой чат">
      <div className="game-chat__messages" aria-live="polite">
        {messages.map((message) => <div key={message.id} className="game-chat__message">{renderColoredText(message.text)}</div>)}
        <div ref={bottomRef} />
      </div>
      {inputOpen && <input
        ref={inputRef}
        className="game-chat__input"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={200}
        placeholder="Введите сообщение..."
        autoComplete="off"
      />}
    </section>
  );
};
