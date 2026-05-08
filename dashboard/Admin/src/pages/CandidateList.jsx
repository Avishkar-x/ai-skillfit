import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCandidates } from "../api/candidates";
import { exportToCSV } from "../utils/csvExport";
import ScoreBadge from "../components/ui/ScoreBadge";
import CategoryBadge from "../components/ui/CategoryBadge";
import LanguageBadge from "../components/ui/Languagebadge";
import FraudIcon from "../components/ui/FraudIcon";
import { Download, Search, RefreshCw, ChevronRight } from "lucide-react";

const DISTRICTS = ["", "Bengaluru", "Mysuru", "Hubli"];
const TRADES = ["", "Electrician", "Plumber", "Welder"];
const LANGUAGES = ["", "kn", "hi", "en"];
const CATEGORIES = [
  "",
  "Job Ready",
  "Needs Training",
  "Needs Verification",
  "Low Quality",
  "Suspected Fraud",
];

const LANG_LABELS = { kn: "Kannada (KN)", hi: "Hindi (HI)", en: "English (EN)" };

export default function CandidateList() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ district: "", trade: "", language: "", category: "" });

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCandidates(filters);
      setCandidates(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    exportToCSV(candidates, `candidates_${Date.now()}.csv`);
  };

  return (
    <div>
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={s.topBar}>
        <div style={s.filterRow}>
          {/* District */}
          <FilterSelect
            label="District"
            value={filters.district}
            onChange={(v) => handleFilter("district", v)}
            options={DISTRICTS}
            display={(v) => v || "All Districts"}
          />
          {/* Trade */}
          <FilterSelect
            label="Trade"
            value={filters.trade}
            onChange={(v) => handleFilter("trade", v)}
            options={TRADES}
            display={(v) => v || "All Trades"}
          />
          {/* Language */}
          <FilterSelect
            label="Language"
            value={filters.language}
            onChange={(v) => handleFilter("language", v)}
            options={LANGUAGES}
            display={(v) => (v ? LANG_LABELS[v] : "All Languages")}
          />
          {/* Category */}
          <FilterSelect
            label="Category"
            value={filters.category}
            onChange={(v) => handleFilter("category", v)}
            options={CATEGORIES}
            display={(v) => v || "All Categories"}
          />

          {/* Reset */}
          <button
            style={s.resetBtn}
            onClick={() => setFilters({ district: "", trade: "", language: "", category: "" })}
          >
            <RefreshCw size={13} />
            Reset
          </button>
        </div>

        {/* Right — count + export */}
        <div style={s.actionRow}>
          <span style={s.countLabel}>
            <Search size={13} />
            {loading ? "Loading..." : `${candidates.length} candidate${candidates.length !== 1 ? "s" : ""}`}
          </span>
          <button style={s.exportBtn} onClick={handleExport} disabled={loading || candidates.length === 0}>
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div style={s.tableCard}>
        {error ? (
          <div style={s.errorMsg}>⚠ Error: {error}</div>
        ) : loading ? (
          <div style={s.loadingMsg}>
            <div style={s.spinner} />
            Loading candidates...
          </div>
        ) : candidates.length === 0 ? (
          <div style={s.emptyMsg}>No candidates match the selected filters.</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>Candidate Name</th>
                <th style={s.th}>District / Trade</th>
                <th style={s.th}>Language</th>
                <th style={{ ...s.th, textAlign: "center" }}>Final Score</th>
                <th style={s.th}>Fitment Category</th>
                <th style={{ ...s.th, textAlign: "center" }}>Flag</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, idx) => (
                <tr
                  key={c.id}
                  style={{ ...s.row, background: idx % 2 === 0 ? "#fff" : "#f8fafd" }}
                  onClick={() => navigate(`/candidate/${c.id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#eef3fc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#f8fafd")}
                >
                  <td style={s.td}>
                    <div style={s.candidateName}>{c.name}</div>
                    <div style={s.candidateId}>ID: {c.id.split("-")[0]}…</div>
                  </td>
                  <td style={s.td}>
                    <div style={s.districtText}>{c.district}</div>
                    <div style={s.tradeText}>{c.trade}</div>
                  </td>
                  <td style={s.td}>
                    <LanguageBadge language={c.language} />
                  </td>
                  <td style={{ ...s.td, textAlign: "center" }}>
                    <ScoreBadge score={c.final_score} />
                  </td>
                  <td style={s.td}>
                    <CategoryBadge category={c.fitment_category} />
                  </td>
                  <td style={{ ...s.td, textAlign: "center" }}>
                    <FraudIcon flags={c.integrity_flags} />
                  </td>
                  <td style={{ ...s.td, color: "var(--gov-navy)", paddingRight: 12 }}>
                    <ChevronRight size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── FilterSelect ──────────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options, display }) {
  return (
    <div style={s.filterGroup}>
      <label style={s.filterLabel}>{label}</label>
      <select
        style={s.filterSelect}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {display(o)}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  topBar: {
    background: "#fff",
    border: "1px solid var(--gov-border)",
    borderRadius: "var(--radius)",
    padding: "14px 16px",
    marginBottom: 16,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    boxShadow: "var(--shadow)",
  },
  filterRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    flexWrap: "wrap",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "var(--gov-text-muted)",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  filterSelect: {
    padding: "7px 28px 7px 10px",
    border: "1px solid var(--gov-border)",
    borderRadius: "var(--radius)",
    fontSize: 13,
    color: "var(--gov-text)",
    background: "#fff",
    outline: "none",
    cursor: "pointer",
    appearance: "auto",
    minWidth: 140,
    fontFamily: "inherit",
  },
  resetBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "7px 12px",
    border: "1px solid var(--gov-border)",
    borderRadius: "var(--radius)",
    background: "#fff",
    color: "var(--gov-text-muted)",
    fontSize: 12,
    fontWeight: 600,
    alignSelf: "flex-end",
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  countLabel: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    color: "var(--gov-text-muted)",
    fontWeight: 500,
  },
  exportBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    background: "var(--gov-navy)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.02em",
  },
  tableCard: {
    background: "#fff",
    border: "1px solid var(--gov-border)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
    boxShadow: "var(--shadow)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  thead: {
    background: "var(--gov-navy)",
  },
  th: {
    padding: "11px 14px",
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  row: {
    cursor: "pointer",
    transition: "background 0.1s ease",
    borderBottom: "1px solid #eef0f5",
  },
  td: {
    padding: "12px 14px",
    fontSize: 13,
    verticalAlign: "middle",
  },
  candidateName: {
    fontWeight: 600,
    color: "var(--gov-navy)",
    fontSize: 13,
  },
  candidateId: {
    fontSize: 10,
    color: "var(--gov-text-muted)",
    marginTop: 2,
    fontFamily: "monospace",
  },
  districtText: {
    fontWeight: 500,
    fontSize: 13,
  },
  tradeText: {
    fontSize: 11,
    color: "var(--gov-text-muted)",
    marginTop: 2,
  },
  loadingMsg: {
    padding: 48,
    textAlign: "center",
    color: "var(--gov-text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontSize: 14,
  },
  spinner: {
    width: 18,
    height: 18,
    border: "2px solid var(--gov-border)",
    borderTop: "2px solid var(--gov-navy)",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  errorMsg: {
    padding: 32,
    textAlign: "center",
    color: "#721c24",
    background: "#f8d7da",
    fontSize: 13,
  },
  emptyMsg: {
    padding: 48,
    textAlign: "center",
    color: "var(--gov-text-muted)",
    fontSize: 14,
  },
};