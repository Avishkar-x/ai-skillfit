export default function StatCard({ label, value, accent = "var(--gov-navy)", icon: Icon }) {
    return (
        <div
            style={{
                background: "#fff",
                border: "1px solid var(--gov-border)",
                borderTop: `3px solid ${accent}`,
                borderRadius: "var(--radius)",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: "var(--shadow)",
            }}
        >
            {Icon && (
                <div
                    style={{
                        width: 40,
                        height: 40,
                        background: accent + "18",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Icon size={18} color={accent} />
                </div>
            )}
            <div>
                <div
                    style={{
                        fontSize: 26,
                        fontWeight: 700,
                        color: accent,
                        lineHeight: 1,
                    }}
                >
                    {value}
                </div>
                <div
                    style={{
                        fontSize: 11,
                        color: "var(--gov-text-muted)",
                        marginTop: 4,
                        fontWeight: 500,
                    }}
                >
                    {label}
                </div>
            </div>
        </div>
    );
}