// src/App.jsx
import React, { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";
import Login from "./components/Login";
import PostList from "./components/PostList";
import PostDetail from "./components/PostDetail";
import PostCreate from "./components/PostCreate";

import { setAuthFromLocalStorage, logout } from "./api";

function ProtectedRoute({ children, loggedIn }) {
  if (!loggedIn) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes({ loggedIn, onLogin, onLogout }) {
  return (
    <Routes>
      <Route path="/" element={<PostList />} />
      <Route path="/posts/:slugOrId" element={<PostDetail />} />
      <Route
        path="/create"
        element={
          <ProtectedRoute loggedIn={loggedIn}>
            <PostCreate onCreated={() => { /* optional refresh logic */ }} />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Login onLogin={onLogin} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(Boolean(localStorage.getItem("accessToken")));

  useEffect(() => {
    setAuthFromLocalStorage();
  }, []);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === "accessToken" || e.key === "refreshToken") {
        setAuthFromLocalStorage();
        setLoggedIn(Boolean(localStorage.getItem("accessToken")));
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLogin = useCallback(() => {
    setAuthFromLocalStorage();
    setLoggedIn(true);
    try { window.history.replaceState({}, "", "/"); } catch {}
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setLoggedIn(false);
    setAuthFromLocalStorage();
    try { window.history.replaceState({}, "", "/"); } catch {}
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header loggedIn={loggedIn} onLogout={handleLogout} />
        <main className="py-8">
          <div className="max-w-6xl mx-auto px-4">
            <AppRoutes loggedIn={loggedIn} onLogin={handleLogin} onLogout={handleLogout} />
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
