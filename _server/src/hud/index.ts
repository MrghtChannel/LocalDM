import rpc from "rage-rpc";

class Hud {
  constructor() {
    rpc.register("hud:get-state", this.getState);
  }

  private getState = (_data: unknown, { player }: RPCEvent) => {
    if (!player?._id) return { error: "Необходимо войти в аккаунт." };
    return {
      data: {
        serverName: "La Puerta",
        online: mp.players.length,
        staticId: player._id,
      },
    };
  };
}

export const $hud = new Hud();
