import rpc from "rage-rpc";

import { $browser, ROUTES } from "@/browser";

type AuthStorage = { email?: string };

const readStorage = (): AuthStorage => {
  try {
    return ((mp.storage.data as Record<string, unknown>).auth as AuthStorage) ?? {};
  } catch {
    return {};
  }
};

class Auth {
  constructor() {
    rpc.register("auth:start", this.start);
    rpc.register("auth:finish", this.finish);
    rpc.register("auth:getSavedEmail", this.getSavedEmail);
    rpc.register("auth:saveEmail", this.saveEmail);
  }

  start = () => {
    mp.players.local.setInvincible(true);
    mp.players.local.freezePosition(true);
    mp.game.audio.prepareMusicEvent("FM_INTRO_START");
    mp.game.audio.triggerMusicEvent("FM_INTRO_START");
    $browser.enableCursor(true);
    $browser.navigateTo({ to: ROUTES.AUTH });
  };

  finish = (_showHud = true) => {
    mp.players.local.setInvincible(false);
    mp.players.local.freezePosition(false);
    mp.game.audio.triggerMusicEvent("FM_INTRO_STOP");
    $browser.enableCursor(false);
    $browser.navigateTo({ to: ROUTES.HUD });
  };

  getSavedEmail = (): string => {
    return readStorage().email ?? "";
  };

  saveEmail = (email: string): void => {
    try {
      const value = String(email ?? "").trim();
      if (!value) return;
      (mp.storage.data as Record<string, unknown>).auth = { email: value };
      mp.storage.flush();
    } catch {
      // ignore
    }
  };
}

export default new Auth();
