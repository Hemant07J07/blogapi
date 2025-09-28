// src/api.js
import axios from "axios";

export const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";
export const TOKEN_OBTAIN_PATH = "/api/v1/token/";           // simplejwt obtain pair (adjust if different)
export const TOKEN_REFRESH_PATH = "/api/v1/token/refresh/"; // simplejwt refresh (adjust if different)

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// set Authorization header intelligently (JWT -> Bearer, single token -> Token)
export function setAuthFromLocalStorage() {
  const t = localStorage.getItem("accessToken");
  if (!t) {
    delete api.defaults.headers.common.Authorization;
    return;
  }
  const isJWT = (typeof t === "string" && (t.match(/\./g) || []).length === 2);
  api.defaults.headers.common.Authorization = isJWT ? `Bearer ${t}` : `Token ${t}`;
}

// Save tokens returned by login endpoints (handles {access,refresh}, {key}, {token}, string)
export function saveTokens(data) {
  if (!data) return;
  // if data is object, pick common keys
  if (typeof data === "object") {
    if (data.access) localStorage.setItem("accessToken", data.access);
    else if (data.key) localStorage.setItem("accessToken", data.key);
    else if (data.token) localStorage.setItem("accessToken", data.token);
    else if (data.access_token) localStorage.setItem("accessToken", data.access_token);
    if (data.refresh) localStorage.setItem("refreshToken", data.refresh);
    else if (data.refresh_token) localStorage.setItem("refreshToken", data.refresh_token);
  } else if (typeof data === "string") {
    localStorage.setItem("accessToken", data);
  }
  setAuthFromLocalStorage();
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  delete api.defaults.headers.common.Authorization;
}

// Optional: try refresh (for JWT flows)
async function attemptTokenRefresh() {
  const refresh = localStorage.getItem("refreshToken");
  if (!refresh) return null;
  try {
    const res = await axios.post(API_BASE + TOKEN_REFRESH_PATH, { refresh });
    saveTokens(res.data);
    return res.data.access || null;
  } catch (err) {
    logout();
    return null;
  }
}

// Refresh queue handling
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, tokenHeader = null) {
  failedQueue.forEach(p => {
    if (error) p.reject(error);
    else p.resolve(tokenHeader);
  });
  failedQueue = [];
}

// Interceptor to attempt refresh on 401 once (works for JWT flows)
api.interceptors.response.use(
  resp => resp,
  async (error) => {
    const originalReq = error.config;
    if (error.response && error.response.status === 401 && !originalReq._retry) {
      originalReq._retry = true;
      if (isRefreshing) {
        // queue and wait
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(header => {
          originalReq.headers.Authorization = header;
          return api(originalReq);
        });
      }
      isRefreshing = true;
      const newAccess = await attemptTokenRefresh();
      isRefreshing = false;
      if (newAccess) {
        const isJWT = (typeof newAccess === "string" && (newAccess.match(/\./g) || []).length === 2);
        const header = isJWT ? `Bearer ${newAccess}` : `Token ${newAccess}`;
        processQueue(null, header);
        originalReq.headers.Authorization = header;
        return api(originalReq);
      }
      processQueue(new Error("refresh failed"), null);
    }
    return Promise.reject(error);
  }
);

// configure once on import
setAuthFromLocalStorage();
