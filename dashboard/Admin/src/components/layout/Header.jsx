import { useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

const PAGE_TITLES = {
    "/": "Candidate List",
    "/stats": "Statistics & Analytics",
};

export default function Header() {
    const location = useLocation();
    const isDetail = location.pathname.startsWith("/candidate/");
    const title = isDetail ? "Candidate Detail" : (PAGE_TITLES[location.pathname] || "Dashboard");

    return (
        <header style={styles.header}>
            {/* Left */}
            <div style={styles.left}>
                <div style={styles.tricolour}>
                    <div style={{ background: "#FF9933", flex: 1 }} />
                    <div style={{ background: "#ffffff", flex: 1 }} />
                    <div style={{ background: "#138808", flex: 1 }} />
                </div>
                <h1 style={styles.title}>{title}</h1>
            </div>

            {/* Right */}
            <div style={styles.right}>
                <ShieldCheck size={14} color="var(--gov-teal-light)" />
                <span style={styles.portalLabel}>Admin Portal</span>
            </div>
        </header>
    );
}

const styles = {
    header: {
        height: "var(--header-height)",
        background: "#253648",          /* slightly lighter than sidebar, same family */
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        flexShrink: 0,
    },
    left: {
        display: "flex",
        alignItems: "center",
        gap: 14,
    },
    tricolour: {
        width: 4,
        height: 26,
        borderRadius: 2,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    title: {
        fontSize: 15,
        fontWeight: 700,
        color: "#fff",
        fontFamily: '"Noto Serif", serif',
        letterSpacing: "0.01em",
    },
    right: {
        display: "flex",
        alignItems: "center",
        gap: 6,
    },
    portalLabel: {
        fontSize: 11,
        color: "rgba(255,255,255,0.45)",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
    },
};