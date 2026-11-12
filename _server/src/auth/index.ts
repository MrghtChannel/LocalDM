import rpc from "rage-rpc";

import { $createCharacter } from "@/create-character";
import { $db } from "@/db";
import { charactersTable, playerApperanceTable, playersTable } from "@/db/schema";
import { $player } from "@/player";
import { $spawnSelect } from "@/spawn-select";
import { compare, hash } from "bcryptjs";
import { eq, inArray } from "drizzle-orm";

class Auth {
  constructor() {
    mp.events.add("playerReady", this.onPlayerReady.bind(this));

    rpc.register("auth:login", this.login.bind(this));
    rpc.register("auth:register", this.register.bind(this));
  }

  onPlayerReady(player: PlayerMp) {
    $player.teleportPlayerToAuth(player);
    rpc.callClient(player, "auth:start");
  }

  async login(data: { email: string; password: string }, { player }: RPCEvent) {
    if (!player) return { error: "Ошибка авторизации!" };
    if (!data.email || !data.password) return { error: "Пароль и почта не могут быть пустыми!" };

    try {
      const dbPlayer = await $db.query.playersTable.findFirst({ where: eq(playersTable.email, data.email) });
      if (!dbPlayer) return { error: "Неверный email или пароль!" };

      const isValidPassword = await compare(data.password, dbPlayer.passwordHash);
      if (!isValidPassword) return { error: "Неверный email или пароль!" };

      player._id = dbPlayer.id;
      player.dimension = player.id + 1000;
      player.spawn(new mp.Vector3(-1704.908, -1087.971, 13.152));
      player.heading = 48.5;
      const characterRows = await $db.query.charactersTable.findMany({ where: eq(charactersTable.playerId, dbPlayer.id) });
      const appearanceRows = characterRows.length
        ? await $db.select().from(playerApperanceTable).where(inArray(playerApperanceTable.characterId, characterRows.map(({ id }) => id)))
        : [];
      const appearanceByCharacter = new Map(appearanceRows.map((appearance) => [appearance.characterId, appearance]));
      const chars = characterRows.map((character) => ({ ...character, appearance: appearanceByCharacter.get(character.id) ?? null }));
      rpc.callClient(player, "auth:finish", false);
      if (chars.length === 0) {
        $createCharacter.start(player);
        return { data: dbPlayer };
      }
      rpc.callClient(player, "character-select:start", { email: dbPlayer.email, characters: chars.map(({ id, name, surname, age, level, experience, money, bank, faction, appearance, createdAt }) => ({ id, name, surname, age, level, experience, cash: money, bank, faction, createdAt, appearance })) });

      return { data: dbPlayer };
    } catch (error) {
      console.error("Login error:", error);
      return { error: "Произошла ошибка при входе. Попробуйте позже." };
    }
  }

  async register(data: { email: string; password: string }, { player }: RPCEvent) {
    if (!player) return { error: "Ошибка регистрации!" };
    if (!data.email || !data.password) return { error: "Пароль и почта не могут быть пустыми!" };

    try {
      const isPlayerExist = await $db.query.playersTable.findFirst({ where: eq(playersTable.email, data.email) });
      if (isPlayerExist) return { error: "Пользователь с такой почтой уже существует!" };

      const passwordHash = await hash(data.password, 10);
      const [inserted] = await $db.insert(playersTable).values({ email: data.email, passwordHash }).$returningId();
      const newPlayer = inserted ? await $db.query.playersTable.findFirst({ where: eq(playersTable.id, inserted.id) }) : undefined;
      if (!newPlayer) return { error: "Не удалось создать аккаунт. Попробуйте ещё раз." };

      player._id = newPlayer.id;
      player.dimension = player.id + 1000;
      player.spawn(new mp.Vector3(-1704.908, -1087.971, 13.152));
      player.heading = 48.5;
      rpc.callClient(player, "auth:finish", false);
      $createCharacter.start(player);

      return { data: newPlayer };
    } catch (error) {
      console.error("Registration error:", error);
      return { error: "Произошла ошибка при регистрации. Попробуйте позже." };
    }
  }
}

export const $auth = new Auth();
