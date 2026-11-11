import rpc from "rage-rpc";

import { $db } from "@/db";
import { charactersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { $player } from "@/player";

type SpawnOption = {
  key: "last" | "default";
  label: string;
  spawnName: string;
  spawnType: "last" | "def";
  x: number;
  y: number;
  z: number;
  h: number;
  warning?: boolean;
};

class SpawnSelect {
  constructor() {
    mp.events.add("playerQuit", this.onPlayerQuit);
    rpc.register("spawn-select:select", this.onSpawnSelect);
    rpc.register("spawn-select:cancel", this.onCancel);
  }

  start = (player: PlayerMp, lastPosition: PlayerMp["_lastPosition"]) => {
    if (!lastPosition || ![lastPosition.x, lastPosition.y, lastPosition.z, lastPosition.heading].every(Number.isFinite)) {
      $player.teleportPlayerToSpawn(player);
      rpc.callClient(player, "auth:finish");
      return;
    }

    const defaultPosition = {
      x: -169.429931640625,
      y: -813.7645874023438,
      z: 31.305158615112305,
      h: 173.6284942626953,
    };
    const options: SpawnOption[] = [
      {
        key: "default",
        label: "Стандартный спавн",
        spawnName: "АРЕНДА ТРАНСПОРТА",
        spawnType: "def",
        ...defaultPosition,
      },
      {
        key: "last",
        label: "Последнее место",
        spawnName: "ПОСЛЕДНЕЕ МЕСТО",
        spawnType: "last",
        ...lastPosition,
        h: lastPosition.heading,
      },
    ];
    const initial = options[0];

    player._spawnSelectActive = true;
    player.dimension = 0;
    player.position = new mp.Vector3(initial.x, initial.y, initial.z);
    player.heading = initial.h;
    player.alpha = 0;
    rpc.callClient(player, "spawn-select:await");
    rpc.callClient(player, "spawn-select:start", {
      fraction: 0,
      spawnOptions: options,
      defaultCamKey: initial.key,
      initialCamCoords: [initial.x, initial.y, initial.z],
      camHeight: 1150,
      previewCamHeight: 1150,
    });
  };

  private onPlayerQuit = async (player: PlayerMp) => {
    if (!player._id || !player._characterId || player._spawnSelectActive) return;

    try {
      const { x, y, z } = player.position;
      await $db
        .update(charactersTable)
        .set({ position: { x, y, z, heading: player.heading } })
        .where(eq(charactersTable.id, player._characterId));
    } catch (error) {
      console.error(error);
    }
  };

  private onSpawnSelect = async (data: { type: "last" | "default" }, { player }: RPCEvent) => {
    if (!player) return { error: "Ошибка выбора спавна" };
    if (!player._spawnSelectActive) return { error: "Выбор спавна уже завершён" };

    const type = data?.type;
    if (type !== "last" && type !== "default") return { error: "Неизвестный спавн" };

    if (type === "last" && player._lastPosition) {
      const { x, y, z, heading } = player._lastPosition;
      $player.teleportToCoord(player, new mp.Vector3(x, y, z), heading);
    } else {
      $player.teleportPlayerToSpawn(player);
    }

    player._spawnSelectActive = false;
    player.alpha = 255;
    rpc.callClient(player, "spawn-select:finish");
    return { data: true };
  };

  private onCancel = (_data: unknown, { player }: RPCEvent) => {
    if (!player || !player._spawnSelectActive) return { data: false };
    player._spawnSelectActive = false;
    $player.teleportPlayerToSpawn(player);
    player.alpha = 255;
    rpc.callClient(player, "spawn-select:finish");
    return { data: true };
  };
}

export const $spawnSelect = new SpawnSelect();
