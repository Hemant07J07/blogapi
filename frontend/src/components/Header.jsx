// src/components/Header.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Header({ loggedIn, onLogout }) {
  const navigate = useNavigate();

  function handleCreateClick(e) {
    // If not logged in, go to login page first
    if (!loggedIn) {
      e.preventDefault();
      navigate("/login");
    }
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-semibold text-indigo-600">MyBlog</Link>
          <nav className="hidden sm:flex gap-4 text-sm text-gray-600">
            <Link to="/">Home</Link>
            <Link to="/create" onClick={handleCreateClick}>Create</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {loggedIn ? (
            <>
              <button
                onClick={() => { onLogout?.(); navigate("/"); }}
                className="px-3 py-1 rounded bg-red-50 text-red-600 text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
