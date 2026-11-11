import rpc from "rage-rpc";

const BASE = { x: 809.11414, y: -19.974813, z: 97.08313 };
const HEADING = -97.68315;
const OFFSET_STEP = 1.15;
const OCCUPIED_RADIUS = 1.1;
const SLOT_ORDER = [0, -1, 1, -2, 2, -3, 3, -4, 4];

function isPositionOccupied(position: Vector3, dimension: number, currentPlayer: PlayerMp) {
  let occupied = false;
  mp.players.forEach((other) => {
    if (!other || other === currentPlayer || !mp.players.exists(other) || other.dimension !== dimension) return;
    const dx = other.position.x - position.x;
    const dy = other.position.y - position.y;
    const dz = other.position.z - position.z;
    if (dx * dx + dy * dy + dz * dz < OCCUPIED_RADIUS * OCCUPIED_RADIUS) occupied = true;
  });
  return occupied;
}

function resolvePosition(player: PlayerMp) {
  const radians = (HEADING * Math.PI) / 180;
  const perpendicularX = Math.cos(radians + Math.PI / 2);
  const perpendicularY = Math.sin(radians + Math.PI / 2);
  const dimension = player.dimension;

  for (const slot of SLOT_ORDER) {
    const position = new mp.Vector3(
      BASE.x + perpendicularX * OFFSET_STEP * slot,
      BASE.y + perpendicularY * OFFSET_STEP * slot,
      BASE.z,
    );
    if (!isPositionOccupied(position, dimension, player)) return position;
  }

  return new mp.Vector3(BASE.x, BASE.y, BASE.z);
}

export const $authLobby = {
  placePlayer(player: PlayerMp) {
    const position = resolvePosition(player);
    // Spawn directly at the lobby slot so the initial world spawn cannot leave
    // the player falling while the authentication UI loads.
    player.spawn(position, HEADING);
    player.health = 100;
    player.armour = 0;
    rpc.callClient(player, "auth-lobby:apply", {
      x: position.x,
      y: position.y,
      z: position.z,
      heading: HEADING,
    });
  },
};
