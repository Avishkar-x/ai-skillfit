// ─────────────────────────────────────────────────────────────────────────────
// scoreUtils.js — colour coding helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getScoreColor(score) {
    if (score >= 7.5) return "score-green";
    if (score >= 5) return "score-amber";
    return "score-red";
}

export function getScoreLabel(score) {
    if (score >= 7.5) return "High";
    if (score >= 5) return "Medium";
    return "Low";
}

export function getCategoryColor(category) {
    const map = {
        "Job Ready": "cat-green",
        "Needs Training": "cat-amber",
        "Needs Verification": "cat-blue",
        "Low Quality": "cat-orange",
        "Suspected Fraud": "cat-red",
    };
    return map[category] || "cat-default";
}

export function getLanguageLabel(code) {
    const map = { kn: "KN", hi: "HI", en: "EN" };
    if (!code) return "N/A";
    return map[code] || code.toUpperCase();
}

export function getLanguageColor(code) {
    const map = { kn: "lang-kn", hi: "lang-hi", en: "lang-en" };
    return map[code] || "lang-en";
}