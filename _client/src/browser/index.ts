import rpc from "rage-rpc";

export const ROUTES = {
  AUTH: "/auth",
  HUD: "/hud",
  CREATE_CHARACTER: "/create-character",
  SPAWN_SELECT: "/spawn-select",
};

export type NpcDialogPayload = {
  actor?: string;
  text: string;
  buttons?: { id: string; label: string }[];
};

const NAVIGATE_RETRY_DELAY = 200;
const NAVIGATE_MAX_ATTEMPTS = 100;

class Browser {
  private url = __RAGEMP_DEV__ ? "http://localhost:5173/" : "package://cef/index.html";
  private browser: BrowserMp;
  private navigateToken = 0;

  constructor() {
    this.init();
  }

  init() {
    this.browser = mp.browsers.new(this.url);

    mp.gui.chat.show(false);
    this.browser.markAsChat();
    return this.browser;
  }

  openChat(state: boolean) {
    this.browser.call("chat:active", state);
  }

  setHudVisible(visible: boolean) {
    this.browser.call("hud:visible", visible);
  }

  pushChatMessage(text: string) {
    this.browser.call("chat:push", text);
  }

  showNpcDialog(data: NpcDialogPayload) {
    return rpc.callBrowsers("npc-dialog:show", data);
  }

  hideNpcDialog() {
    return rpc.callBrowsers("npc-dialog:hide");
  }

  execute(script: string) {
    this.browser.execute(script);
  }

  navigateTo({ to, state }: { to: string; state?: any }) {
    const token = ++this.navigateToken;
    this.sendNavigate({ to, state }, token, 0);
  }

  private async sendNavigate(payload: { to: string; state?: any }, token: number, attempt: number) {
    if (token !== this.navigateToken) return;

    try {
      await rpc.callBrowsers("cef:navigateTo", payload);
    } catch {
      if (attempt >= NAVIGATE_MAX_ATTEMPTS) return;
      setTimeout(() => this.sendNavigate(payload, token, attempt + 1), NAVIGATE_RETRY_DELAY);
    }
  }

  enableCursor(enable: boolean) {
    if (!enable) return mp.gui.cursor.show(false, false);
    setTimeout(() => mp.gui.cursor.show(true, true), 300);
  }
}

export const $browser = new Browser();
