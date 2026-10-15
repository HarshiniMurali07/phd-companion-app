import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "https://phd-companion-app-backend.vercel.app"
).replace(/\/$/, "");

const API_KEY = import.meta.env.VITE_API_KEY;

// Add the API key to every request that goes to our backend.
const originalFetch = window.fetch.bind(window);

window.fetch = (input, init = {}) => {
  const url = typeof input === "string" ? input : input.url;

  if (API_KEY && url.startsWith(API_BASE)) {
    const headers = new Headers(
      init.headers ||
        (typeof input !== "string" ? input.headers : undefined)
    );
    headers.set("X-API-Key", API_KEY);
    return originalFetch(input, { ...init, headers });
  }

  return originalFetch(input, init);
};

// Wake the backend as soon as the site opens (health is unprotected).
fetch(`${API_BASE}/api/health`).catch(() => {});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
