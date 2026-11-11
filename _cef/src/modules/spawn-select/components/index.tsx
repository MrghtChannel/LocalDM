import { useState } from "react";
import { useLocation } from "react-router";
import rpc from "rage-rpc";

import spawnIconsSource from "../components/spawn-icons.js?raw";
import { spawnIconsExtra } from "../components/spawn-icons-extra";
import { useSelectSpawn } from "../api/mutations/select-spawn";

import "../components/spawn-menu.css";

type SpawnType = "last" | "default";

type SpawnOption = {
  key: SpawnType;
  label: string;
  spawnName: string;
  spawnType: "last" | "def";
  warning?: boolean;
};

type SpawnPayload = { spawnOptions?: SpawnOption[] };

const spawnIcons = JSON.parse(
  spawnIconsSource.trim().replace(/^window\.SPAWN_ICONS=/, "").replace(/;\s*$/, "")
) as Record<string, string>;

const SpawnSelect = () => {
  const { state } = useLocation();
  const payload = state as SpawnPayload | null;
  const options = payload?.spawnOptions ?? [];
  const [selectedSpawn, setSelectedSpawn] = useState<SpawnType | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const { mutate, isPending } = useSelectSpawn();

  const previewSpawn = async (type: SpawnType) => {
    if (isPending || isPreviewing || selectedSpawn === type) return;
    setSelectedSpawn(type);
    setIsPreviewing(true);
    try {
      const result = await rpc.callClient("spawn-select:preview", type);
      if (result === false) throw new Error("Не удалось показать место спавна");
      setSelectedSpawn(type);
    } catch (error) {
      setSelectedSpawn(null);
      console.error("Spawn preview failed", error);
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <main className="spawn-select-screen">
      <svg className="spawn-select-screen__gradient-defs" aria-hidden="true">
        <defs>
          <linearGradient
            id="spawnMenu_ico_gradient"
            x1="40.1523"
            y1="-0.15625"
            x2="40.1523"
            y2="79.8439"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFB800" />
            <stop offset="1" stopColor="#FF5C00" />
          </linearGradient>
        </defs>
      </svg>

      <div className="spawnMenu-gradient" />

      {selectedSpawn && !isPreviewing && (
        <div className="spawnMenu-confirm">
          {options.find((option) => option.key === selectedSpawn)?.warning && (
            <>
              <svg className="spawnMenu-confirm__warning" width="71" height="65" viewBox="0 0 71 65" aria-hidden="true">
                <path d="M35.5 0C30.9 0 26.8 2.4 24.6 6.4L1.7 46C-0.6 50-.6 54.7 1.7 58.7 4 62.6 8.1 65 12.6 65h45.7c4.6 0 8.7-2.4 11-6.4 2.3-4 2.3-8.7 0-12.6L46.4 6.4C44.2 2.4 40.1 0 35.5 0Zm0 19a4 4 0 0 1 4 4l-1.3 17.5a2.7 2.7 0 0 1-5.4 0L31.5 23a4 4 0 0 1 4-4Zm0 34a3.8 3.8 0 1 1 0-7.6 3.8 3.8 0 0 1 0 7.6Z" fill="white" />
              </svg>
              <div className="spawnMenu-confirm__warning-text">Вы потеряете всё оружие</div>
            </>
          )}
          <button
            type="button"
            className="spawn-select-confirm"
            onClick={() => mutate(selectedSpawn)}
            disabled={isPending}
          >
            {isPending ? "ЗАГРУЗКА…" : "ПОДТВЕРДИТЬ"}
          </button>
        </div>
      )}

      <div className={`spawnMenu-bar${isPreviewing || isPending ? " is-pending" : ""}`} aria-label="Выберите место появления">
        {options.map((option) => {
          const active = selectedSpawn === option.key;
          const icon = spawnIcons[option.spawnType] ?? spawnIconsExtra[option.spawnType] ?? spawnIcons.pfHouse;

          return (
            <button
              key={option.key}
              type="button"
              className={`spawnMenu-spawnBlock${active ? " active" : ""}`}
              onClick={() => void previewSpawn(option.key)}
              aria-pressed={active}
              disabled={isPending || isPreviewing}
            >
              <span className="spawnMenu-icon-wrap" dangerouslySetInnerHTML={{ __html: icon.replace('class="spawnMenu-ico"', 'class="spawnMenu-ico pe-none"') }} />
              <span className="spawnMenu-text">{option.spawnName || option.label}</span>
            </button>
          );
        })}
      </div>
    </main>
  );
};

export default SpawnSelect;
