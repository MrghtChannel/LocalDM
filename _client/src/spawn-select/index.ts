import rpc from "rage-rpc";

import { $browser, ROUTES } from "@/browser";
import { $hud } from "@/hud";

type SpawnOption = {
  key: string;
  x: number;
  y: number;
  z: number;
  h?: number;
};

type SpawnPayload = {
  fraction?: number;
  spawnOptions: SpawnOption[];
  initialCamCoords?: [number, number, number] | null;
  camHeight?: number;
  previewCamHeight?: number;
};

const CAMERA_FOV = 48;
const CAMERA_PAN_MS = 700;
const FOCUS_ZOOM_DELTA = 320;
const FOCUS_MIN_HEIGHT = 400;

class SpawnSelect {
  private active = false;
  private payload: SpawnPayload | null = null;
  private camera: CameraMp | null = null;
  private pendingCamera: CameraMp | null = null;
  private panTimer: ReturnType<typeof setTimeout> | null = null;
  private panGeneration = 0;
  private cameraPosition: { x: number; y: number; z: number } | null = null;
  private cameraViewKey: string | null = null;
  private cameraZoomed = false;

  constructor() {
    rpc.register("spawn-select:start", this.start);
    rpc.register("spawn-select:finish", this.finish);
    rpc.register("spawn-select:preview", this.preview);
    rpc.register("spawn-select:await", this.awaitSelection);
    mp.events.add("spawnselect:cancel", this.cancel);
    mp.events.add("render", this.render);
  }

  private start = (payload: SpawnPayload) => {
    if (!payload || !Array.isArray(payload.spawnOptions) || payload.spawnOptions.length === 0) return;

    this.active = true;
    this.payload = payload;
    this.cameraViewKey = null;
    this.cameraZoomed = false;
    this.cameraPosition = null;
    this.panGeneration++;
    this.clearPanTimer();
    try { mp.events.call("removeCamera"); } catch { /* ignore */ }

    const initial = payload.initialCamCoords
      ? { x: payload.initialCamCoords[0], y: payload.initialCamCoords[1], z: payload.initialCamCoords[2] }
      : payload.spawnOptions[0];
    if (!initial) return;

    this.hideLocalPlayer(true);
    mp.players.local.setInvincible(true);
    this.setCamera(initial.x, initial.y, initial.z, Number(payload.camHeight) || 1150, false);
    $browser.enableCursor(true);
    $browser.navigateTo({ to: ROUTES.SPAWN_SELECT, state: payload });
    $hud.enableHud(false);
    mp.game.graphics.transitionToBlurred(500);
  };

  private awaitSelection = () => {
    try {
      mp.players.local.freezePosition(true);
      mp.players.local.setAlpha(0);
    } catch {
      // Player may not be fully streamed in yet.
    }
  };

  private preview = (key: string): Promise<boolean> => {
    if (!this.active || !this.payload) return Promise.resolve(false);
    const option = this.payload.spawnOptions.find((item) => item.key === String(key));
    if (!option) return Promise.resolve(false);

    const generation = ++this.panGeneration;
    this.clearPanTimer();
    this.hideLocalPlayer(true);
    this.moveLocalPlayer(option.x, option.y, option.z);

    const sameLocation = this.cameraPosition &&
      Math.abs(this.cameraPosition.x - option.x) < 0.75 &&
      Math.abs(this.cameraPosition.y - option.y) < 0.75 &&
      Math.abs(this.cameraPosition.z - option.z) < 0.75;
    const height = Number(this.payload.previewCamHeight || this.payload.camHeight) || 1150;
    const targetHeight = this.cameraViewKey === null && sameLocation && !this.cameraZoomed
      ? Math.max(FOCUS_MIN_HEIGHT, height - FOCUS_ZOOM_DELTA)
      : height;

    return new Promise((resolve) => {
      const finish = () => {
        this.cameraViewKey = option.key;
        this.cameraZoomed = targetHeight < height;
        resolve(true);
      };
      if (this.cameraZoomed && (!sameLocation || this.cameraViewKey !== option.key)) {
        this.riseOverviewThenPan(option.x, option.y, option.z, height, generation, finish);
      } else {
        this.setCamera(option.x, option.y, option.z, targetHeight, true, generation, finish);
      }
    });
  };

  private riseOverviewThenPan(x: number, y: number, z: number, height: number, generation: number, onDone: () => void) {
    const from = this.cameraPosition ?? { x, y, z };
    const riseDuration = Math.max(250, Math.floor(CAMERA_PAN_MS * 0.4));
    const overview = mp.cameras.new(
      "default",
      new mp.Vector3(from.x, from.y, from.z + height),
      new mp.Vector3(0, 0, 0),
      CAMERA_FOV,
    );
    overview.pointAtCoord(from.x, from.y, from.z);

    if (!this.camera || !mp.cameras.exists(this.camera)) {
      this.setCamera(x, y, z, height, true, generation, onDone);
      return;
    }

    overview.setActiveWithInterp(this.camera.handle, riseDuration, 1, 1);
    this.panTimer = setTimeout(() => {
      if (generation !== this.panGeneration) {
        if (mp.cameras.exists(overview)) overview.destroy();
        return;
      }
      this.panTimer = null;
      if (this.camera && mp.cameras.exists(this.camera)) this.camera.destroy();
      this.camera = overview;
      this.cameraPosition = from;
      this.cameraZoomed = false;
      this.setCamera(x, y, z, height, true, generation, onDone);
    }, riseDuration + 30);
  }

  private setCamera(
    x: number,
    y: number,
    z: number,
    height: number,
    interpolate: boolean,
    generation = this.panGeneration,
    onDone?: () => void,
  ) {
    const next = mp.cameras.new(
      "default",
      new mp.Vector3(x, y, z + height),
      new mp.Vector3(0, 0, 0),
      CAMERA_FOV,
    );
    next.pointAtCoord(x, y, z);

    if (interpolate && this.camera && mp.cameras.exists(this.camera)) {
      this.pendingCamera = next;
      next.setActiveWithInterp(this.camera.handle, CAMERA_PAN_MS, 1, 1);
      this.panTimer = setTimeout(() => {
        if (generation !== this.panGeneration) {
          if (mp.cameras.exists(next)) next.destroy();
          return;
        }
        this.panTimer = null;
        if (this.camera && mp.cameras.exists(this.camera)) this.camera.destroy();
        this.camera = next;
        this.pendingCamera = null;
        this.cameraPosition = { x, y, z };
        onDone?.();
      }, CAMERA_PAN_MS + 40);
      return;
    }

    if (this.camera && mp.cameras.exists(this.camera)) this.camera.destroy();
    this.camera = next;
    this.pendingCamera = null;
    next.setActive(true);
    mp.game.cam.renderScriptCams(true, true, interpolate ? 300 : 450, true, false);
    this.cameraPosition = { x, y, z };
    onDone?.();
  }

  private hideLocalPlayer(hidden: boolean) {
    const player = mp.players.local;
    if (hidden) {
      player.freezePosition(true);
      player.setAlpha(0);
      return;
    }
    player.setVisible(true, false);
    player.setAlpha(255);
    player.freezePosition(false);
  }

  private moveLocalPlayer(x: number, y: number, z: number) {
    try {
      const player = mp.players.local;
      player.freezePosition(true);
      player.setAlpha(0);
      player.position = new mp.Vector3(x, y, z);
    } catch {
      // Ignore while the player entity is being recreated.
    }
  }

  private clearPanTimer() {
    if (this.panTimer) clearTimeout(this.panTimer);
    this.panTimer = null;
    if (this.pendingCamera && mp.cameras.exists(this.pendingCamera)) this.pendingCamera.destroy();
    this.pendingCamera = null;
  }

  private destroyCamera() {
    this.clearPanTimer();
    if (this.camera && mp.cameras.exists(this.camera)) {
      this.camera.setActive(false);
      this.camera.destroy();
    }
    this.camera = null;
    this.cameraPosition = null;
    mp.game.cam.renderScriptCams(false, true, 400, true, false);
  }

  private finish = () => {
    this.active = false;
    this.payload = null;
    this.cameraViewKey = null;
    this.cameraZoomed = false;
    this.panGeneration++;
    this.destroyCamera();
    this.hideLocalPlayer(false);
    mp.players.local.setInvincible(false);
    mp.game.audio.triggerMusicEvent("FM_INTRO_STOP");
    $browser.enableCursor(false);
    $browser.navigateTo({ to: ROUTES.HUD });
    $hud.enableHud(true);
    mp.gui.chat.activate(true);
    mp.game.graphics.transitionFromBlurred(500);
  };

  private render = () => {
    if (!this.active) return;
    if (!mp.gui.cursor.visible) mp.gui.cursor.show(true, true);
    mp.game.ui.displayHud(false);
    mp.game.ui.displayRadar(false);
  };

  private cancel = () => {
    if (!this.active) return;
    void rpc.callServer("spawn-select:cancel", {}).catch(() => undefined);
  };
}

export default new SpawnSelect();
