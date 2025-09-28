// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { setAuthFromLocalStorage } from "./api";

setAuthFromLocalStorage(); // configure axios headers from saved token before first request

createRoot(document.getElementById("root")).render(<App />);
