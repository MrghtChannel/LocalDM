import { useState } from "react";

import authBackground from "@/assets/images/accounts-bg.webp";
import authFigure from "@/assets/images/accounts-figure.webp";
import authLogo from "@/assets/images/flowdm-logo.png";
import { Login } from "@/modules/auth/components/login";
import { Register } from "@/modules/auth/components/register";

import "./auth.css";

export const Auth = () => {
  const [flow, setFlow] = useState<"login" | "register">("login");
  const isLogin = flow === "login";

  return (
    <main className="accounts-auth" style={{ backgroundImage: `url(${authBackground})` }}>
      <svg className="accounts-auth__gradients" aria-hidden="true">
        <defs>
          <linearGradient id="authIcoGrad1" gradientTransform="rotate(30)">
            <stop offset="45%" stopColor="#0072ee" />
            <stop offset="99%" stopColor="#11ade4" />
          </linearGradient>
          <linearGradient id="authIcoGrad2" gradientTransform="rotate(30)">
            <stop offset="45%" stopColor="#ff6513" />
            <stop offset="99%" stopColor="#ffde37" />
          </linearGradient>
        </defs>
      </svg>

      <img className="accounts-auth__figure" src={authFigure} draggable={false} />

      <section className="auth-form-block" aria-label="Авторизация">
        <header className="accounts-auth__header">
          <img className="accounts-auth__logo" src={authLogo} draggable={false} />
          <div
            className="menu-text f-l s-24 accounts-auth__server-name"
          >
            La Puerta
          </div>
        </header>

        <nav className="accounts-auth__tabs" aria-label="Вход или регистрация">
          <button
            type="button"
            className={`menu-text s-24 accounts-auth__tab ${!isLogin ? "is-active" : ""}`}
            onClick={() => setFlow("register")}
            aria-pressed={!isLogin}
          >
            Регистрация
          </button>
          <button
            type="button"
            className={`menu-text s-24 accounts-auth__tab ${isLogin ? "is-active" : ""}`}
            onClick={() => setFlow("login")}
            aria-pressed={isLogin}
          >
            Авторизация
          </button>
        </nav>

        {isLogin ? <Login /> : <Register />}
      </section>
    </main>
  );
};
