import { PlayerAppearance } from "./types";
import { $authLobby } from "@/auth-lobby";

class Player {
  setPlayerAppearance = (player: PlayerMp, appearance: PlayerAppearance | null) => {
    if (!appearance) return;
    player._sex = appearance.sex;

    player.setCustomization(
      appearance.sex === "male",
      appearance.mother,
      appearance.father,
      0,
      appearance.mother,
      appearance.father,
      0,
      appearance.similarity,
      appearance.skinTone,
      0,
      appearance.eyeColor,
      appearance.hairColor,
      0,
      [
        appearance.noseWidth,
        appearance.noseHeight,
        appearance.noseLength,
        appearance.noseBridge,
        appearance.noseTip,
        appearance.noseBridgeShift,
        appearance.browHeight,
        appearance.browWidth,
        appearance.cheekboneHeight,
        appearance.cheekboneWidth,
        appearance.cheeksWidth,
        appearance.eyes,
        appearance.lips,
        appearance.jawWidth,
        appearance.jawHeight,
        appearance.chinLength,
        appearance.chinPosition,
        appearance.chinWidth,
        appearance.chinShape,
        appearance.neckWidth,
      ]
    );

    player.setHeadOverlay(1, [appearance.facialHair, 1, appearance.beardColor, 0]);
    player.setHeadOverlay(0, [appearance.blemishes, 1, 0, 0]);
    player.setHeadOverlay(2, [appearance.eyebrows, 1, appearance.hairColor, 0]);
    player.setHeadOverlay(3, [appearance.ageing, 1, 0, 0]);
    player.setHeadOverlay(4, [appearance.makeup, 1, 0, 0]);
    player.setHeadOverlay(6, [appearance.complexion, 1, 0, 0]);
    player.setHeadOverlay(7, [appearance.sunDamage, 1, 0, 0]);
    player.setHeadOverlay(8, [appearance.lipstick, 1, 0, 0]);
    player.setHeadOverlay(9, [appearance.molesFreckles, 1, 0, 0]);

    player.setClothes(2, appearance.hairStyle, 0, 0);
  };

  teleportToCoord = (player: PlayerMp, coords: Vector3, heading: number) => {
    player.position = coords;
    player.heading = heading;
  };

  teleportPlayerToSpawn = (player: PlayerMp) => {
    player.position = new mp.Vector3(
      -193.80992126464844,
      -804.4339599609375,
      30.45510482788086
    );
    player.heading = 18.35268211364746;
  };

  teleportPlayerToAuth = (player: PlayerMp) => {
    $authLobby.placePlayer(player);
  };
}

export const $player = new Player();
