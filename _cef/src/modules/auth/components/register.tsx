import { useState } from "react";
import type { FormEvent } from "react";

import rpc from "rage-rpc";

export const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    if (password !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен содержать не менее 6 символов.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await rpc.callServer("auth:register", { email: email.trim(), password });
      if (response?.error) setError(response.error);
    } catch {
      setError("Не удалось связаться с сервером. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="d-flex column mt-20 accounts-auth__form" onSubmit={handleRegister}>
      <label className="menu-input-block auth-input server-23 accounts-auth__field">
        <svg className="auth-input-ico server-23" width="22" height="22" viewBox="0 0 127 87" aria-hidden="true">
          <path d="M120.7,0H6.3A6.3,6.3,0,0,0,0,6.3V81a6.3,6.3,0,0,0,6.3,6.3H120.7A6.3,6.3,0,0,0,127,81V6.3A6.3,6.3,0,0,0,120.7,0ZM10,19.6,39.7,47.5,10,70.6ZM66.9,53a5.2,5.2,0,0,1-6.8,0L14.4,10h98.2ZM47,54.4l6.3,5.8a14.7,14.7,0,0,0,20.4,0l6.8-6.3,29.3,23.4H17.6ZM87.9,47,117,19.6V70.2Z" />
        </svg>
        <input
          className="menu-input"
          type="email"
          autoComplete="email"
          placeholder="Почта"
          aria-label="Почта"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isLoading}
          required
        />
      </label>

      <label className="menu-input-block auth-input server-23 accounts-auth__field mt-5">
        <svg className="auth-input-ico server-23" width="22" height="22" viewBox="0 0 127 128" aria-hidden="true">
          <path d="M105,44H93V30.1C93,13.5,79.8,0,63.5,0S34,13.5,34,30.1V44H22A21.9,21.9,0,0,0,0,66v40a21.9,21.9,0,0,0,22,22h83a21.9,21.9,0,0,0,22-22V66A21.9,21.9,0,0,0,105,44ZM44,30.1C44,19,52.7,10,63.5,10S83,19,83,30.1V44H44ZM117,106a12,12,0,0,1-12,12H22a12,12,0,0,1-12-12V66A12,12,0,0,1,22,54h83a12,12,0,0,1,12,12Z" />
          <circle cx="39" cy="84.5" r="7.5" />
          <circle cx="64" cy="84.5" r="7.5" />
          <circle cx="88" cy="84.5" r="7.5" />
        </svg>
        <input
          className="menu-input"
          type="password"
          autoComplete="new-password"
          placeholder="Пароль"
          aria-label="Пароль"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isLoading}
          required
        />
      </label>

      <label className="menu-input-block auth-input server-23 accounts-auth__field mt-5">
        <svg className="auth-input-ico server-23" width="22" height="22" viewBox="0 0 128 130" aria-hidden="true">
          <path d="M78,120H25.4A15.5,15.5,0,0,1,10,104.5v-37A15.5,15.5,0,0,1,25.4,52h77a15.4,15.4,0,0,1,13.4,7.9,5,5,0,1,0,8.7-5A25.6,25.6,0,0,0,102.4,42H93.5V30.1C93.5,13.5,80.3,0,64,0S34.5,13.5,34.5,30.1V42H25.4A25.5,25.5,0,0,0,0,67.5v37A25.5,25.5,0,0,0,25.4,130H78a5,5,0,0,0,5-5A5,5,0,0,0,78,120ZM44.5,30.1C44.5,19,53.2,10,64,10s19.5,9,19.5,20.1V42h-39Z" />
          <circle cx="39.5" cy="84.5" r="7.5" />
          <circle cx="64.5" cy="84.5" r="7.5" />
          <circle cx="90.5" cy="84.5" r="7.5" />
          <path d="M125,69.4a5.1,5.1,0,0,0-6.6,2.6l-18.3,41.6L81.4,96.7a5,5,0,0,0-7.1.4,4.9,4.9,0,0,0,.3,7l23.9,21.6a5.5,5.5,0,0,0,3.4,1.3h1a5,5,0,0,0,3.6-2.9l21.1-48A5.1,5.1,0,0,0,125,69.4Z" />
        </svg>
        <input
          className="menu-input"
          type="password"
          autoComplete="new-password"
          placeholder="Повтор пароля"
          aria-label="Повтор пароля"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={isLoading}
          required
        />
      </label>

      <button className="menu-btn auth-btn server-23 accounts-auth__submit mt-20" type="submit" disabled={isLoading}>
        {isLoading ? "Создаём аккаунт…" : "Создать аккаунт"}
      </button>
      {error && <div className="accounts-auth__error" role="alert">{error}</div>}
    </form>
  );
};
