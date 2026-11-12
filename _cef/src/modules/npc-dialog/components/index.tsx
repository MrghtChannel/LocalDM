import { useEffect, useState } from "react";
import rpc from "rage-rpc";

import type { NpcDialogData } from "../types";
import "./npc-dialog.css";

export const NpcDialog = () => {
  const [dialog, setDialog] = useState<NpcDialogData | null>(null);

  useEffect(() => {
    const api = {
      show: (data: NpcDialogData) => {
        if (!data || typeof data.text !== "string") return;
        setDialog({
          actor: typeof data.actor === "string" ? data.actor : "",
          text: data.text,
          buttons: Array.isArray(data.buttons) ? data.buttons : [],
        });
      },
      hide: () => setDialog(null),
    };

    window.npcDialog = api;
    rpc.register("npc-dialog:show", api.show);
    rpc.register("npc-dialog:hide", api.hide);

    return () => {
      if (window.npcDialog === api) delete window.npcDialog;
      rpc.unregister("npc-dialog:show");
      rpc.unregister("npc-dialog:hide");
    };
  }, []);

  if (!dialog) return null;

  return (
    <div className="npc-dialog-layer">
      <div className="npc-dialog__gradient" />
      <section className="npc-dialog" role="dialog" aria-live="polite" aria-label={dialog.actor || "Диалог"}>
        {dialog.actor && <div className="npc-dialog__actor">{dialog.actor}</div>}
        <div className="npc-dialog__text">{dialog.text}</div>
        {!!dialog.buttons?.length && (
          <div className="npc-dialog__buttons">
            {dialog.buttons.map((button) => (
              <button
                className="npc-dialog__button"
                key={button.id}
                type="button"
                onClick={() => {
                  rpc.triggerClient("npc-dialog:click", button.id);
                  setDialog(null);
                }}
              >
                <span>{button.label}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
