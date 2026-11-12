import rpc from "rage-rpc";

import { $db } from "@/db";
import { charactersTable, playerApperanceTable } from "@/db/schema";
import { $player } from "@/player";
import { PlayerAppearance } from "@/player/types";
import { eq, sql } from "drizzle-orm";

import { CreateCharacterData } from "./types";

class CreateCharacter {
  constructor() {
    rpc.register("create-character:create", this.createCharacter);
  }

  start(player: PlayerMp) {
    rpc.callClient(player, "create-character:start", player._pendingCharacter ?? { sex: "male" });
    $player.teleportToCoord(player, new mp.Vector3(-591.5745, 40.3543, 87.4189), -3.5519);
  }

  private createCharacter = async (data: CreateCharacterData, { player }: RPCEvent) => {
    try {
      if (!player) return { error: "Ошибка при создании персонажа #1" };
      if (!player._id) return { error: "Не удалось определить аккаунт игрока. Перезайдите в игру." };
      const fallbackName = String(data.name ?? "Персонаж").trim().split(/\s+/);
      const pending = player._pendingCharacter;
      const details = {
        name: pending?.name ?? fallbackName.shift() ?? "Персонаж",
        surname: pending?.surname ?? (fallbackName.join(" ") || "Персонаж"),
        age: pending?.age ?? data.age,
      };
      const created = await $db.transaction(async (tx) => {
        await tx.execute(sql`SELECT id FROM players WHERE id = ${player._id} FOR UPDATE`);
        const existing = await tx.select({ id: charactersTable.id }).from(charactersTable).where(eq(charactersTable.playerId, player._id));
        if (existing.length >= 3) return null;
        const [insertedCharacter] = await tx.insert(charactersTable).values({ playerId: player._id, name: details.name, surname: details.surname, age: details.age }).$returningId();
        if (!insertedCharacter) throw new Error("Character insert failed");
        const [character] = await tx.select().from(charactersTable).where(eq(charactersTable.id, insertedCharacter.id));
        const [insertedAppearance] = await tx.insert(playerApperanceTable).values({
          ...data.headBlendData,
          ...data.headOverlay, ...data.faceFeature, ...data.colors, characterId: character.id,
        }).$returningId();
        const [appearance] = insertedAppearance
          ? await tx.select().from(playerApperanceTable).where(eq(playerApperanceTable.id, insertedAppearance.id))
          : [];
        if (!appearance) throw new Error("Appearance insert failed");
        return { character, appearance };
      });

      if (!created) return { error: "В аккаунте уже создано 3 персонажа." };
      const { character, appearance: apperance } = created;

      player._characterId = character.id;
      player._lastPosition = null;
      player._pendingCharacter = undefined;
      this.finish(player, apperance);
      return { data: apperance };
    } catch (error) {
      console.log("error creating character", error);
      return { error: "Ошибка при создании персонажа #4" };
    }
  };

  private finish(player: PlayerMp, appearance: PlayerAppearance) {
    rpc.callClient(player, "create-character:finish");
    $player.setPlayerAppearance(player, appearance);
    player.dimension = 0;
    $player.teleportPlayerToSpawn(player);
  }
}

export const $createCharacter = new CreateCharacter();
