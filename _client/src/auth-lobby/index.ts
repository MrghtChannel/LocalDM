import rpc from "rage-rpc";

type AuthLobbyPosition = { x: number; y: number; z: number; heading: number };
type AuthLobbyGlobal = typeof globalThis & {
  AUTH_LOBBY_BASE: { x: number; y: number; z: number };
  AUTH_LOBBY_HEADING: number;
  AUTH_LOBBY_OFFSET_STEP: number;
  AUTH_LOBBY_OCCUPY_RADIUS: number;
  __authLobbySpawn: AuthLobbyPosition | null;
  resolveAuthLobbySpawnPos?: (heading: number, isOccupied?: (position: AuthLobbyPosition) => boolean) => AuthLobbyPosition;
  getAuthLobbySpawn?: () => AuthLobbyPosition;
};

const authLobby = globalThis as AuthLobbyGlobal;
authLobby.AUTH_LOBBY_BASE = { x: 809.11414, y: -19.974813, z: 97.08313 };
authLobby.AUTH_LOBBY_HEADING = -97.68315;
authLobby.AUTH_LOBBY_OFFSET_STEP = 1.15;
authLobby.AUTH_LOBBY_OCCUPY_RADIUS = 1.1;
authLobby.__authLobbySpawn = null;

function offsetForSlot(slot: number, heading: number): AuthLobbyPosition {
  const radians = (heading * Math.PI) / 180;
  const step = authLobby.AUTH_LOBBY_OFFSET_STEP;
  return {
    x: authLobby.AUTH_LOBBY_BASE.x + Math.cos(radians + Math.PI / 2) * step * slot,
    y: authLobby.AUTH_LOBBY_BASE.y + Math.sin(radians + Math.PI / 2) * step * slot,
    z: authLobby.AUTH_LOBBY_BASE.z,
    heading,
  };
}

function isNear(position: AuthLobbyPosition, other: Vector3): boolean {
  const dx = other.x - position.x;
  const dy = other.y - position.y;
  const dz = other.z - position.z;
  const radius = authLobby.AUTH_LOBBY_OCCUPY_RADIUS;
  return dx * dx + dy * dy + dz * dz < radius * radius;
}

authLobby.resolveAuthLobbySpawnPos = (headingValue, isOccupied = () => false) => {
  const heading = Number.isFinite(Number(headingValue)) ? Number(headingValue) : authLobby.AUTH_LOBBY_HEADING;
  for (const slot of [0, -1, 1, -2, 2, -3, 3, -4, 4]) {
    const position = offsetForSlot(slot, heading);
    if (!isOccupied(position)) return position;
  }
  return { ...authLobby.AUTH_LOBBY_BASE, heading };
};

authLobby.getAuthLobbySpawn = () => {
  if (authLobby.__authLobbySpawn && Number.isFinite(authLobby.__authLobbySpawn.x)) return authLobby.__authLobbySpawn;
  try {
    const player = mp.players.local;
    const dimension = player.dimension;
    return authLobby.resolveAuthLobbySpawnPos!(authLobby.AUTH_LOBBY_HEADING, (position) => {
      let occupied = false;
      mp.players.forEachInStreamRange((other) => {
        if (!other || other === player || other.dimension !== dimension) return;
        if (isNear(position, other.position)) occupied = true;
      });
      return occupied;
    });
  } catch {
    return { ...authLobby.AUTH_LOBBY_BASE, heading: authLobby.AUTH_LOBBY_HEADING };
  }
};

rpc.register("auth-lobby:apply", (position: AuthLobbyPosition) => {
  if (!position || !Number.isFinite(Number(position.x))) return;
  authLobby.__authLobbySpawn = {
    x: Number(position.x),
    y: Number(position.y),
    z: Number(position.z),
    heading: Number.isFinite(Number(position.heading)) ? Number(position.heading) : authLobby.AUTH_LOBBY_HEADING,
  };
});

export {};
