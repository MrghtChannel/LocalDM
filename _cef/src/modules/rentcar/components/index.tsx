import { useState } from "react";
import { useLocation } from "react-router";
import rpc from "rage-rpc";
import "./rentcar.css";

type Car = { id: number; name: string; model: string; price: number };
export const RentCar = () => {
  const location = useLocation();
  const cars = (location.state as { cars?: Car[] } | null)?.cars ?? [];
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const close = () => { rpc.triggerClient("rent:close"); };
  const rent = async (car: Car) => {
    setBusy(car.model); setMessage("");
    try {
      const result = await rpc.callServer("rent:car", car.model) as { success?: boolean; error?: string };
      if (result?.error) { setMessage(result.error); setBusy(null); return; }
      close();
    } catch { setMessage("Не удалось связаться с сервером."); setBusy(null); }
  };
  return <main className="rentcar"><section className="rentcar__panel">
    <header className="rentcar__header"><div><small>ТРАНСПОРТНЫЙ СЕРВИС</small><h1>Аренда транспорта</h1></div><button onClick={close} aria-label="Закрыть">×</button></header>
    {message && <p className="rentcar__message">{message}</p>}
    <div className="rentcar__grid">{cars.map(car => <article className="rentcar__card" key={car.id}>
      <span className="rentcar__icon">{car.model.includes("sparrow") || car.model === "avtr" ? "✈" : "🚘"}</span><h2>{car.name}</h2>
      <p>Аренда транспорта</p><strong>${car.price.toLocaleString("ru-RU")}</strong>
      <button disabled={busy !== null} onClick={() => void rent(car)}>{busy === car.model ? "Оформляем…" : "Арендовать"}</button>
    </article>)}</div>
  </section></main>;
};
