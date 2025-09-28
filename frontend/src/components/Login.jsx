// src/components/Login.jsx
import React, { useState } from "react";
import { api, saveTokens, TOKEN_OBTAIN_PATH } from "../api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      // 1) Try standard SimpleJWT obtain pair first:
      try {
        const res = await api.post(TOKEN_OBTAIN_PATH, { username, password });
        // e.g. { access, refresh }
        saveTokens(res.data);
        setLoading(false);
        if (onLogin) onLogin();
        return;
      } catch (err) {
        // ignore and try fallback
      }

      // 2) Fallback: common dj-rest-auth login (returns {key} or {access})
      const res2 = await api.post("/api/v1/rest-auth/login/", { username, password });
      saveTokens(res2.data);
      setLoading(false);
      if (onLogin) onLogin();
    } catch (err) {
      setLoading(false);
      console.error("Login failed:", err.response?.data || err.message);
      alert("Login failed: " + JSON.stringify(err.response?.data || err.message));
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: "8px auto" }}>
      <h3>Login</h3>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" required style={{ width: "100%", padding:8, marginBottom:8 }} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" required style={{ width: "100%", padding:8, marginBottom:8 }} />
      <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
    </form>
  );
}
