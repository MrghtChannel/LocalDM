import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import rpc from "rage-rpc";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const saved = await rpc.callClient("auth:getSavedEmail");
        if (!cancelled && typeof saved === "string" && saved) {
          setEmail((current) => current || saved);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    const trimmedEmail = email.trim();

    try {
      const response = await rpc.callServer("auth:login", { email: trimmedEmail, password });
      if (response?.error) {
        setError(response.error);
      } else {
        try {
          await rpc.callClient("auth:saveEmail", trimmedEmail);
        } catch {
          // ignore
        }
      }
    } catch {
      setError("Не удалось связаться с сервером. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="d-flex column mt-20 accounts-auth__form" onSubmit={handleLogin}>
      <label className="menu-input-block auth-input server-23 accounts-auth__field">
        <svg className="auth-input-ico server-23" width="22" height="24" viewBox="0 0 127 141.3" aria-hidden="true">
          <path d="M63.5,73A36.5,36.5,0,1,0,27,36.5,36.6,36.6,0,0,0,63.5,73Zm0-63A26.5,26.5,0,1,1,37,36.5,26.5,26.5,0,0,1,63.5,10Z" />
          <path d="M87.8,79.6A59.7,59.7,0,0,1,63.4,85a57.8,57.8,0,0,1-24.2-5.4A39.3,39.3,0,0,0,0,118.9v13a232.1,232.1,0,0,0,64.6,9.4,211.9,211.9,0,0,0,62.4-9.4v-13A39.3,39.3,0,0,0,87.8,79.6ZM117,124.4a202.7,202.7,0,0,1-52.4,6.9,221.7,221.7,0,0,1-54.6-7v-5.4A29.3,29.3,0,0,1,37.3,89.7,69.2,69.2,0,0,0,63.4,95a70.8,70.8,0,0,0,26.2-5.3A29.3,29.3,0,0,1,117,118.9Z" />
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
          autoComplete="current-password"
          placeholder="Пароль"
          aria-label="Пароль"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isLoading}
          required
        />
      </label>

      <button className="menu-btn auth-btn server-23 accounts-auth__submit mt-20" type="submit" disabled={isLoading}>
        {isLoading ? "Входим…" : "Войти"}
      </button>
      {error && <div className="accounts-auth__error" role="alert">{error}</div>}
    </form>
  );
};
