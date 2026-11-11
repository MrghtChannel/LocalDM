import rpc from "rage-rpc";
import { eq } from "drizzle-orm";
import { $db } from "@/db";
import { charactersTable } from "@/db/schema";
import { $player } from "@/player";
import { $spawnSelect } from "@/spawn-select";
import { $createCharacter } from "@/create-character";

class CharacterSelect {
  constructor() {
    rpc.register("character-select:play", this.play);
    rpc.register("character-select:create", this.create);
    rpc.register("character-select:preview", this.preview);
    rpc.register("character-select:back", this.back);
  }

  private getOwned = async (player: PlayerMp, id: number) => {
    if (!player._id || !Number.isInteger(id)) return null;
    return $db.query.charactersTable.findFirst({ where: eq(charactersTable.id, id), with: { appearance: true } }).then((c) => c?.playerId === player._id ? c : null);
  };

  private play = async (id: number, { player }: RPCEvent) => {
    if (!player) return { error: "Не удалось выбрать персонажа." };
    const character = await this.getOwned(player, Number(id));
    if (!character?.appearance) return { error: "Персонаж не найден или не завершено создание." };
    player._characterId = character.id;
    player._lastPosition = character.position ?? null;
    $player.setPlayerAppearance(player, character.appearance);
    player.dimension = 0;
    rpc.callClient(player, "character-select:close");
    $spawnSelect.start(player, player._lastPosition);
    return { data: true };
  };

  private preview = async (id: number, { player }: RPCEvent) => {
    if (!player) return { data: false };
    const character = await this.getOwned(player, Number(id));
    if (!character?.appearance) return { data: false };
    $player.setPlayerAppearance(player, character.appearance);
    return { data: true };
  };

  private back = (_data: unknown, { player }: RPCEvent) => {
    if (!player) return { data: false };
    player._id = undefined;
    player._characterId = undefined;
    player.dimension = 0;
    $player.teleportPlayerToAuth(player);
    rpc.callClient(player, "character-select:close");
    rpc.callClient(player, "auth:start");
    return { data: true };
  };

  private create = async (data: { gender?: number }, { player }: RPCEvent) => {
    if (!player?._id) return { error: "Сначала войдите в аккаунт." };
    const list = await $db.query.charactersTable.findMany({ where: eq(charactersTable.playerId, player._id) });
    if (list.length >= 3) return { error: "В аккаунте уже созданы 3 персонажа." };
    player._pendingCharacter = { sex: data?.gender === 0 ? "female" : "male" };
    $createCharacter.start(player);
    return { data: true };
  };
}

export const $characterSelect = new CharacterSelect();
