import rpc from "rage-rpc";
import { $browser } from "@/browser";

type Character = { id: number; name: string; surname: string; age: number; level: number; experience: number; cash: number; bank: number; faction?: string | null; createdAt?: string | null };
type Payload = { email: string; characters: Character[] };

class CharacterSelect {
  private browser: BrowserMp | null = null;
  private camera: CameraMp | null = null;
  private pending: Payload | null = null;

  constructor() {
    rpc.register("character-select:start", this.start);
    rpc.register("character-select:close", this.close);
    mp.events.add("browserDomReady", this.onBrowserReady);
    mp.events.add("charselect:select", this.onSelect);
    mp.events.add("charselect:play", (id: number) => void this.serverCall("character-select:play", Number(id)));
    mp.events.add("charselect:create", (raw: string) => {
      try { void this.serverCall("character-select:create", JSON.parse(String(raw))); } catch { this.error("Не удалось прочитать данные персонажа."); }
    });
    mp.events.add("charselect:back", () => void rpc.callServer("character-select:back"));
  }

  start = (data: Payload) => {
    this.close();
    $browser.setHudVisible(false);
    this.pending = data;
    const x = -1704.908, y = -1087.971, z = 13.152, h = 228.5, dist = 2.6;
    const localPlayer = mp.players.local;
    localPlayer.freezePosition(true);
    localPlayer.setInvincible(true);
    mp.game.streaming.requestCollisionAtCoord(x, y, z);
    mp.game.streaming.loadScene(x, y, z);
    localPlayer.setCoordsNoOffset(x, y, z, false, false, false);
    localPlayer.setHeading((h + 180) % 360);
    this.browser = mp.browsers.new("package://cef/charselect/index.html");
    const radians = h * Math.PI / 180;
    this.camera = mp.cameras.new("default", new mp.Vector3(x + Math.sin(radians) * dist, y - Math.cos(radians) * dist, z + 0.55), new mp.Vector3(0, 0, 0), 36);
    this.camera.pointAtCoord(x, y, z + 0.5);
    this.camera.setActive(true);
    mp.game.cam.renderScriptCams(true, false, 0, true, false);
    mp.gui.cursor.show(true, true);
    mp.game.ui.displayRadar(false);
    mp.game.ui.displayHud(false);
  };

  close = () => {
    if (this.browser) { this.browser.destroy(); this.browser = null; }
    if (this.camera) {
      this.camera.setActive(false);
      mp.game.cam.renderScriptCams(false, false, 0, true, false);
      this.camera.destroy();
      this.camera = null;
    }
    this.pending = null;
    mp.gui.cursor.show(false, false);
    mp.players.local.freezePosition(false);
    mp.game.ui.displayRadar(true);
    mp.game.ui.displayHud(true);
    $browser.setHudVisible(true);
  };

  private onBrowserReady = (browser: BrowserMp) => {
    if (browser !== this.browser || !this.pending) return;
    const characters = this.pending.characters.map((c) => {
      return { id: c.id, name: c.name, surname: c.surname, age: c.age, level: c.level, exp: c.experience, expMax: 100, cash: c.cash, bank: c.bank, faction: c.faction ?? "Безработный", created: c.createdAt ? new Date(c.createdAt).toLocaleDateString("ru-RU") : "", org: null };
    });
    browser.execute(`charSelect.init(${JSON.stringify({ login: this.pending.email, maxSlots: 3, characters })})`);
    this.pending = null;
  };

  private onSelect = (id: number) => { if (id) void rpc.callServer("character-select:preview", Number(id)); };
  private serverCall = async (method: string, payload: unknown) => {
    try {
      const result = await rpc.callServer(method, payload) as { error?: string };
      if (result?.error) this.error(result.error);
    } catch { this.error("Не удалось связаться с сервером."); }
  };
  private error(message: string) { this.browser?.execute(`charSelect.error(${JSON.stringify(message)})`); }
}

export const $characterSelect = new CharacterSelect();
