import { useEffect, useState } from "react";
import rpc from "rage-rpc";

import { Chat } from "@/modules/chat/components";
import "./hud.css";

type HudState = { serverName: string; online: number; staticId: number };

function getClock() {
  const now = new Date();
  return {
    time: new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", hour: "2-digit", minute: "2-digit" }).format(now),
    date: new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", day: "2-digit", month: "2-digit", year: "numeric" }).format(now),
  };
}

export const Hud = () => {
  const [server, setServer] = useState<HudState>({ serverName: "La Puerta", online: 0, staticId: 0 });
  const [clock, setClock] = useState(getClock);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = () => {
      void rpc.callServer("hud:get-state").then((result) => {
        if (mounted && result?.data) setServer(result.data as HudState);
      }).catch(() => undefined);
    };
    load();
    const stateTimer = setInterval(load, 30_000);
    const clockTimer = setInterval(() => setClock(getClock()), 1_000);
    return () => { mounted = false; clearInterval(stateTimer); clearInterval(clockTimer); };
  }, []);

  useEffect(() => {
    const events = mp.events;
    if (!events) return;
    const handler = (value: boolean) => setVisible(Boolean(value));
    events.add("hud:visible", handler);
    return () => events.remove("hud:visible");
  }, []);

  return (
    <div className="game-hud" style={{ display: visible ? "" : "none" }}>
      <div className="game-hud__brand" aria-label="FlowDM">
        <span className="game-hud__star">✦</span>
        <span className="game-hud__brand-strong">FLOW</span><span>DM</span><span className="game-hud__brand-strong">.fun</span>
      </div>
      <div className="game-hud__meta">
        <span className="game-hud__server">{server.serverName}</span>
        <span className="game-hud__online">{server.online} в сети</span>
        <span className="game-hud__id">[#{server.staticId}]</span>
      </div>
      <div className="game-hud__clock"><span>{clock.time}</span><span>{clock.date}</span></div>
      <Chat />
    </div>
  );
};
