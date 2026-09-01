// ==========================================
// SKILLBRIDGE — API CONFIGURATION
// Auto-detects local vs deployed Render backend
// ==========================================

const RENDER_BACKEND_URL = "https://ansora-sim.onrender.com"; // Replace with your Render URL after creating service

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const API_URL = localStorage.getItem("sb_backend_url") || (isLocal ? "http://localhost:5000" : RENDER_BACKEND_URL);

// Expose globally for vanilla scripts
if (typeof window !== "undefined") {
    window.API_URL = API_URL;
}
