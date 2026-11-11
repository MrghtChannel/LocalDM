import rpc from "rage-rpc";

class Chat {
  constructor() {
    mp.events.add("playerChat", this.onPlayerChat);
    rpc.register("chat:send", this.send);
  }

  private onPlayerChat = (player: PlayerMp, message: string) => {
    this.broadcast(player, message);
  };

  private send = (message: string, { player }: RPCEvent) => {
    if (!player?._id || !player._characterId) return { error: "Сначала войдите в игру." };
    this.broadcast(player, message);
    return { data: true };
  };

  private broadcast(player: PlayerMp, message: string) {
    const clean = String(message ?? "").trim().slice(0, 200);
    if (!clean) return;
    const line = `!{#FFFFFF}${player.name}: !{#FFFFFF}${clean}`;
    mp.players.forEach((recipient) => {
      if (recipient?._id) rpc.callClient(recipient, "chat:push", line);
    });
  }
}

export default new Chat();
