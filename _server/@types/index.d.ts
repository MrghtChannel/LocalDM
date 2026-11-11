declare global {
  interface PlayerMp {
    _id?: number;
    _characterId?: number;
    _sex: "male" | "female";
    _lastPosition: { x: number; y: number; z: number; heading: number } | null;
    _spawnSelectActive?: boolean;
    _pendingCharacter?: { name?: string; surname?: string; age?: number; sex?: "male" | "female" };
  }

  type RPCEvent = {
    environment: string;
    id?: string;
    player?: PlayerMp;
  };
}

export {};
