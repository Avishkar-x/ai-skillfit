import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/candidates";
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(username, password);
            navigate("/", { replace: true });
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={s.wrapper}>
            <div style={s.card}>
                {/* Header */}
                <div style={s.header}>
                    <div style={s.iconCircle}>
                        <ShieldCheck size={28} color="#fff" />
                    </div>
                    <h1 style={s.title}>SkillSetu Admin</h1>
                    <p style={s.subtitle}>Candidate Assessment Dashboard</p>
                </div>

                {/* Error banner */}
                {error && (
                    <div style={s.errorBox}>
                        ⚠ {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} style={s.form}>
                    <div style={s.field}>
                        <label style={s.label}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={s.input}
                            placeholder="Enter admin username"
                            required
                            autoFocus
                        />
                    </div>

                    <div style={s.field}>
                        <label style={s.label}>Password</label>
                        <div style={s.passwordWrap}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ ...s.input, paddingRight: 40 }}
                                placeholder="Enter password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={s.eyeBtn}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !username || !password}
                        style={{
                            ...s.submitBtn,
                            opacity: loading || !username || !password ? 0.6 : 1,
                        }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                                Signing in…
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div style={s.footer}>
                    <span style={s.govBadge}>🏛 Government of Karnataka</span>
                    <span style={s.footerText}>
                        Directorate of Electronic Delivery of Citizen Services (EDCS)
                    </span>
                </div>
            </div>

            {/* Keyframe animation for spinner */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
    wrapper: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        padding: 20,
    },
    card: {
        width: "100%",
        maxWidth: 400,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        overflow: "hidden",
    },
    header: {
        background: "linear-gradient(135deg, #0c2340 0%, #1a3a5c 100%)",
        padding: "32px 24px 24px",
        textAlign: "center",
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.15)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        border: "2px solid rgba(255,255,255,0.2)",
    },
    title: {
        fontSize: 20,
        fontWeight: 700,
        color: "#fff",
        fontFamily: '"Noto Serif", serif',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: "rgba(255,255,255,0.6)",
        letterSpacing: "0.04em",
    },
    errorBox: {
        margin: "16px 24px 0",
        padding: "10px 14px",
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: 6,
        fontSize: 12,
        color: "#991b1b",
        fontWeight: 500,
    },
    form: {
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    label: {
        fontSize: 11,
        fontWeight: 700,
        color: "#374151",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #d1d5db",
        borderRadius: 6,
        fontSize: 13,
        outline: "none",
        transition: "border-color 0.2s",
        boxSizing: "border-box",
    },
    passwordWrap: {
        position: "relative",
    },
    eyeBtn: {
        position: "absolute",
        right: 10,
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "#6b7280",
        padding: 4,
    },
    submitBtn: {
        width: "100%",
        padding: "11px 0",
        background: "linear-gradient(135deg, #0c2340 0%, #1a3a5c 100%)",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        letterSpacing: "0.02em",
        marginTop: 4,
    },
    footer: {
        borderTop: "1px solid #e5e7eb",
        padding: "14px 24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: 2,
    },
    govBadge: {
        fontSize: 11,
        fontWeight: 700,
        color: "#0c2340",
    },
    footerText: {
        fontSize: 10,
        color: "#6b7280",
    },
};
