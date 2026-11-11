import { $browser } from "@/browser";
import rpc from "rage-rpc";

class Chat {
  private isOpen = false;

  constructor() {
    mp.keys.bind(0x54, true, this.openChat); // T
    rpc.register("chat:push", this.pushChatMessage);
    rpc.register("chat:close", this.closeChat);

    mp.events.add("playerChat", this.closeChat);
    mp.events.add("playerCommand", this.closeChat);
  }

  private openChat = () => {
    mp.console.logInfo("Chat opened");
    if (this.isOpen) return this.closeChat();

    this.isOpen = true;
    $browser.openChat(true);
    $browser.enableCursor(true);
  };

  private closeChat = () => {
    this.isOpen = false;

    $browser.openChat(false);
    $browser.enableCursor(false);
  }

  private pushChatMessage = (text: string) => {
    $browser.pushChatMessage(text);
  };
}

export default new Chat();
