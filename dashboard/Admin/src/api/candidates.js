// ─────────────────────────────────────────────────────────────────────────────
// API LAYER — with JWT Authentication
// ─────────────────────────────────────────────────────────────────────────────

import { MOCK_CANDIDATES, MOCK_CANDIDATE_DETAILS } from "../data/mockData";

const USE_MOCK = false;
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// ── Token Management ─────────────────────────────────────────────────────────
export function getToken() {
    return localStorage.getItem("skillsetu_token");
}

export function setToken(token) {
    localStorage.setItem("skillsetu_token", token);
}

export function clearToken() {
    localStorage.removeItem("skillsetu_token");
}

export function isAuthenticated() {
    return !!getToken();
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function login(username, password) {
    const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Login failed");
    }

    const data = await res.json();
    setToken(data.access_token);
    return data;
}

export function logout() {
    clearToken();
    window.location.href = "/login";
}

// ── Authenticated Fetch Helper ────────────────────────────────────────────────
async function apiFetch(path) {
    const token = getToken();
    const headers = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, { headers });



    if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
    return res.json();
}

// ── Candidate List ─────────────────────────────────────────────────────────────
export async function fetchCandidates(filters = {}) {
    if (USE_MOCK) {
        await delay(300);
        let data = [...MOCK_CANDIDATES];

        if (filters.district) data = data.filter((c) => c.district === filters.district);
        if (filters.trade) data = data.filter((c) => c.trade === filters.trade);
        if (filters.language) data = data.filter((c) => c.language === filters.language);
        if (filters.category) data = data.filter((c) => c.fitment_category === filters.category);

        return data;
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    const qs = params.toString() ? `?${params.toString()}` : "";
    return apiFetch(`/candidates${qs}`);
}

// ── Candidate Detail ────────────────────────────────────────────────────────────
export async function fetchCandidateById(id) {
    if (USE_MOCK) {
        await delay(200);
        const detail = MOCK_CANDIDATE_DETAILS[id];
        if (!detail) throw new Error("Candidate not found");
        return detail;
    }

    return apiFetch(`/candidate/${id}`);
}

// ── Utility ───────────────────────────────────────────────────────────────────
function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
}