import rpc from "rage-rpc";
import { $browser } from "@/browser";
import { ROUTES } from "@/browser";

type RentCar = { id: number; name: string; model: string; price: number };
type RentOpen = { data?: { cars: RentCar[]; hub: boolean; siteId: string }; error?: string };

class RentCarClient {
  private opening = false;
  private active = false;
  private cars: RentCar[] = [];

  constructor() {
    mp.keys.bind(0x45, true, () => void this.open());
    mp.events.add("npc-dialog:click", this.onDialogClick);
    mp.events.add("rent:close", this.close);
  }

  private open = async () => {
    if (this.opening || this.active || mp.players.local.vehicle || mp.gui.cursor.visible) return;
    this.opening = true;
    try {
      const result = await rpc.callServer("rent:open", {}) as RentOpen;
      if (result.error || !result.data) return;
      this.cars = result.data.cars;
      await $browser.showNpcDialog({ actor: "Арендатор:", text: "Привет! Могу выдать транспорт в аренду. Оплата наличными, сразу на месте.", buttons: [{ id: "rent:open", label: "Посмотреть транспорт" }, { id: "rent:leave", label: "Уйти" }] });
      this.active = true;
      $browser.enableCursor(true);
    } catch { /* The server may be unavailable. */ }
    finally { this.opening = false; }
  };

  private onDialogClick = (id: string) => {
    if (!this.active) return;
    if (id === "rent:leave") { this.close(); return; }
    if (id !== "rent:open") return;
    $browser.hideNpcDialog();
    $browser.enableCursor(true);
    $browser.navigateTo({ to: ROUTES.RENTCAR, state: { cars: this.cars } });
  };

  private close = () => {
    this.active = false;
    $browser.hideNpcDialog();
    $browser.enableCursor(false);
    $browser.navigateTo({ to: ROUTES.HUD });
  };
}

export const $rentCar = new RentCarClient();
