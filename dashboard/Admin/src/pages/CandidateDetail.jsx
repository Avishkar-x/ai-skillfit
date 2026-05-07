import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCandidateById } from "../api/candidates";
import ScoreBadge from "../components/ui/ScoreBadge";
import CategoryBadge from "../components/ui/CategoryBadge";
import LanguageBadge from "../components/ui/LanguageBadge";
import { FraudBanner } from "../components/ui/FraudIcon";
import { ArrowLeft, User, MapPin, Wrench, MessageSquare, FileText, Headphones, Image } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

export default function CandidateDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCandidateById(id)
            .then(setCandidate)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} onBack={() => navigate("/")} />;
    if (!candidate) return null;

    const { name, district, trade, language, final_score, confidence_score, fitment_category, answers = [], integrity_flags = [], overall_summary } = candidate;

    return (
        <div style={s.page}>
            {/* ── Back button ────────────────────────────────────────────────── */}
            <button style={s.backBtn} onClick={() => navigate(-1)}>
                <ArrowLeft size={15} />
                Back to List
            </button>

            {/* ── Fraud banner ───────────────────────────────────────────────── */}
            <FraudBanner flags={integrity_flags} />

            {/* ── Candidate header card ──────────────────────────────────────── */}
            <div style={s.headerCard}>
                <div style={s.avatarBlock}>
                    <div style={s.avatar}>
                        <User size={28} color="var(--gov-navy)" />
                    </div>
                    <div>
                        <h2 style={s.name}>{name}</h2>
                        <div style={s.metaRow}>
                            <MetaChip icon={MapPin} label={district} />
                            <MetaChip icon={Wrench} label={trade} />
                            <LanguageBadge language={language} />
                        </div>
                    </div>
                </div>

                <div style={s.scoreBlock}>
                    <div style={s.scoreItem}>
                        <div style={s.scoreTitle}>Final Score</div>
                        <ScoreBadge score={final_score} large />
                    </div>
                    <div style={s.scoreDivider} />
                    <div style={s.scoreItem}>
                        <div style={s.scoreTitle}>Confidence</div>
                        <ScoreBadge score={confidence_score} large />
                    </div>
                    <div style={s.scoreDivider} />
                    <div style={s.scoreItem}>
                        <div style={s.scoreTitle}>Fitment</div>
                        <CategoryBadge category={fitment_category} large />
                    </div>
                </div>
            </div>

            {/* ── Per-question breakdown ─────────────────────────────────────── */}
            <SectionTitle icon={MessageSquare} title="Per Question Breakdown" />
            <div style={s.tableCard}>
                <table style={s.table}>
                    <thead>
                        <tr style={s.thead}>
                            <th style={{ ...s.th, width: 60 }}>Q.No</th>
                            <th style={s.th}>Transcript</th>
                            <th style={{ ...s.th, textAlign: "center" }}>Relevance</th>
                            <th style={{ ...s.th, textAlign: "center" }}>Completeness</th>
                            <th style={{ ...s.th, textAlign: "center" }}>Clarity</th>
                            <th style={s.th}>Summary</th>
                            <th style={{ ...s.th, textAlign: "center" }}>Audio</th>
                            <th style={{ ...s.th, textAlign: "center" }}>Evidence</th>
                        </tr>
                    </thead>
                    <tbody>
                        {answers.map((a, idx) => (
                            <tr key={a.question_id} style={{ ...s.row, background: idx % 2 === 0 ? "#fff" : "#f8fafd" }}>
                                <td style={{ ...s.td, textAlign: "center" }}>
                                    <span style={s.qNum}>Q{a.question_id}</span>
                                </td>
                                <td style={{ ...s.td, maxWidth: 260 }}>
                                    <div style={s.transcript}>{a.transcript}</div>
                                    {a.created_at && (
                                        <div style={s.timestamp}>{new Date(a.created_at).toLocaleString("en-IN")}</div>
                                    )}
                                </td>
                                <td style={{ ...s.td, textAlign: "center" }}>
                                    <ScoreBadge score={a.relevance_score} />
                                </td>
                                <td style={{ ...s.td, textAlign: "center" }}>
                                    <ScoreBadge score={a.completeness_score} />
                                </td>
                                <td style={{ ...s.td, textAlign: "center" }}>
                                    <ScoreBadge score={a.clarity_score} />
                                </td>
                                <td style={{ ...s.td, maxWidth: 220 }}>
                                    <div style={s.summaryText}>{a.per_question_summary}</div>
                                </td>
                                <td style={{ ...s.td, textAlign: "center" }}>
                                    {a.audio_url ? (
                                        <audio controls style={s.audioPlayer}>
                                            <source src={`${BACKEND_URL}${a.audio_url}`} type="audio/webm" />
                                        </audio>
                                    ) : (
                                        <span style={s.noMedia}>—</span>
                                    )}
                                </td>
                                <td style={{ ...s.td, textAlign: "center" }}>
                                    {a.keyframe_urls && a.keyframe_urls.length > 0 ? (
                                        <div style={s.keyframeRow}>
                                            {a.keyframe_urls.map((url, ki) => (
                                                <img
                                                    key={ki}
                                                    src={`${BACKEND_URL}${url}`}
                                                    alt={`Frame ${ki + 1}`}
                                                    style={s.keyframeImg}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <span style={s.noMedia}>—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Overall Mistral summary ────────────────────────────────────── */}
            {overall_summary && (
                <>
                    <SectionTitle icon={FileText} title="Overall Assessment Summary" />
                    <div style={s.summaryBox}>
                        <div style={s.summaryLabel}>Mistral AI Summary</div>
                        <p style={s.summaryContent}>{overall_summary}</p>
                    </div>
                </>
            )}
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function MetaChip({ icon: Icon, label }) {
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--gov-text-muted)", fontWeight: 500 }}>
            <Icon size={12} />
            {label}
        </span>
    );
}

function SectionTitle({ icon: Icon, title }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "24px 0 10px", borderBottom: "2px solid var(--gov-navy)", paddingBottom: 6 }}>
            <Icon size={15} color="var(--gov-navy)" />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--gov-navy)", letterSpacing: "0.02em", textTransform: "uppercase" }}>
                {title}
            </h3>
        </div>
    );
}

function LoadingState() {
    return (
        <div style={{ padding: 80, textAlign: "center", color: "var(--gov-text-muted)", fontSize: 14 }}>
            Loading candidate details…
        </div>
    );
}

function ErrorState({ message, onBack }) {
    return (
        <div style={{ padding: 40 }}>
            <button style={s.backBtn} onClick={onBack}>
                <ArrowLeft size={15} />
                Back
            </button>
            <div style={{ marginTop: 24, color: "#721c24", background: "#f8d7da", padding: 20, borderRadius: 6, fontSize: 13 }}>
                ⚠ {message}
            </div>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
    page: { maxWidth: 1100 },
    backBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 14px",
        border: "1px solid var(--gov-border)",
        borderRadius: "var(--radius)",
        background: "#fff",
        color: "var(--gov-navy)",
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 16,
        cursor: "pointer",
    },
    headerCard: {
        background: "#fff",
        border: "1px solid var(--gov-border)",
        borderLeft: "4px solid var(--gov-navy)",
        borderRadius: "var(--radius)",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        flexWrap: "wrap",
        boxShadow: "var(--shadow)",
        marginBottom: 4,
    },
    avatarBlock: {
        display: "flex",
        alignItems: "center",
        gap: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        background: "#e8f0fe",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid var(--gov-border)",
        flexShrink: 0,
    },
    name: {
        fontSize: 20,
        fontWeight: 700,
        fontFamily: '"Noto Serif", serif',
        color: "var(--gov-navy)",
        marginBottom: 6,
    },
    metaRow: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
    },
    scoreBlock: {
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
    },
    scoreItem: {
        textAlign: "center",
    },
    scoreTitle: {
        fontSize: 10,
        fontWeight: 700,
        color: "var(--gov-text-muted)",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginBottom: 6,
    },
    scoreDivider: {
        width: 1,
        height: 40,
        background: "var(--gov-border)",
    },
    tableCard: {
        background: "#fff",
        border: "1px solid var(--gov-border)",
        borderRadius: "var(--radius)",
        overflow: "auto",
        boxShadow: "var(--shadow)",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        minWidth: 700,
    },
    thead: {
        background: "var(--gov-navy)",
    },
    th: {
        padding: "10px 14px",
        fontSize: 10,
        fontWeight: 700,
        color: "rgba(255,255,255,0.85)",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        textAlign: "left",
        whiteSpace: "nowrap",
    },
    row: {
        borderBottom: "1px solid #eef0f5",
    },
    td: {
        padding: "12px 14px",
        fontSize: 12,
        verticalAlign: "top",
    },
    qNum: {
        background: "var(--gov-navy)",
        color: "#fff",
        borderRadius: 4,
        padding: "2px 7px",
        fontSize: 11,
        fontWeight: 700,
    },
    transcript: {
        fontSize: 12,
        lineHeight: 1.6,
        color: "var(--gov-text)",
    },
    timestamp: {
        fontSize: 10,
        color: "var(--gov-text-muted)",
        marginTop: 4,
    },
    summaryText: {
        fontSize: 11,
        color: "var(--gov-text-muted)",
        lineHeight: 1.5,
        fontStyle: "italic",
    },
    summaryBox: {
        background: "#fff",
        border: "1px solid var(--gov-border)",
        borderLeft: "4px solid var(--gov-saffron)",
        borderRadius: "var(--radius)",
        padding: "16px 20px",
        boxShadow: "var(--shadow)",
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: 700,
        color: "var(--gov-saffron)",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginBottom: 8,
    },
    summaryContent: {
        fontSize: 13,
        lineHeight: 1.7,
        color: "var(--gov-text)",
    },
    audioPlayer: {
        width: 140,
        height: 32,
    },
    noMedia: {
        fontSize: 12,
        color: "var(--gov-text-muted)",
    },
    keyframeRow: {
        display: "flex",
        gap: 4,
        justifyContent: "center",
    },
    keyframeImg: {
        width: 48,
        height: 36,
        objectFit: "cover",
        borderRadius: 4,
        border: "1px solid var(--gov-border)",
        cursor: "pointer",
    },
};