import { AlertTriangle } from "lucide-react";

// Small icon — used in the candidate table row
export default function FraudIcon({ flags = [] }) {
    if (!flags || flags.length === 0) return null;
    return (
        <span
            title={`Flagged: ${flags.map((f) => f.flag_type).join(", ")}`}
            style={{ color: "#dc3545" }}
        >
            <AlertTriangle size={15} strokeWidth={2.5} />
        </span>
    );
}

// Full banner — used at the top of Candidate Detail view
export function FraudBanner({ flags = [] }) {
    if (!flags || flags.length === 0) return null;
    return (
        <div
            style={{
                background: "#f8d7da",
                border: "1px solid #f5c2c7",
                borderLeft: "4px solid #dc3545",
                borderRadius: "var(--radius)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
            }}
        >
            <AlertTriangle size={18} color="#dc3545" strokeWidth={2.5} />
            <div>
                <div style={{ fontWeight: 700, color: "#721c24", fontSize: 13 }}>
                    ⚠ Integrity Flag Detected
                </div>
                <div style={{ color: "#721c24", fontSize: 12, marginTop: 2 }}>
                    {flags.map((f, i) => (
                        <span key={i} style={{ marginRight: 8 }}>
                            <strong>{f.flag_type.replace(/_/g, " ").toUpperCase()}</strong>
                            {f.created_at &&
                                ` — ${new Date(f.created_at).toLocaleDateString("en-IN")}`}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}