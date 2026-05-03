// ─────────────────────────────────────────────────────────────────────────────
// API LAYER
// Set USE_MOCK = false and set BASE_URL when your backend is connected
// ─────────────────────────────────────────────────────────────────────────────

import { MOCK_CANDIDATES, MOCK_CANDIDATE_DETAILS } from "../data/mockData";

const USE_MOCK = false; // ← flip to false when DB is connected
const BASE_URL = "http://localhost:8000"; // ← update to your backend URL

// ── Helper ────────────────────────────────────────────────────────────────────
async function apiFetch(path) {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
    return res.json();
}

// ── Candidate List ─────────────────────────────────────────────────────────────
export async function fetchCandidates(filters = {}) {
    if (USE_MOCK) {
        await delay(300); // simulate network
        let data = [...MOCK_CANDIDATES];

        if (filters.district) data = data.filter((c) => c.district === filters.district);
        if (filters.trade) data = data.filter((c) => c.trade === filters.trade);
        if (filters.language) data = data.filter((c) => c.language === filters.language);
        if (filters.category) data = data.filter((c) => c.fitment_category === filters.category);

        return data;
    }

    // Real API
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