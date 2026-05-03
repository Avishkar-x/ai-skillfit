import { NavLink } from "react-router-dom";
import { Users, BarChart2, LayoutDashboard } from "lucide-react";

const NAV = [
    { to: "/", label: "Candidate List", icon: Users, end: true },
    { to: "/stats", label: "Statistics", icon: BarChart2 },
];

export default function Sidebar() {
    return (
        <aside style={styles.sidebar}>
            {/* Brand */}
            <div style={styles.brand}>
                <div style={styles.emblemBox}>
                    <LayoutDashboard size={18} color="#fff" />
                </div>
                <div>
                    <div style={styles.brandTitle}>SkillFit</div>
                    <div style={styles.brandSub}>Candidate Assessment System</div>
                </div>
            </div>

            <div style={styles.divider} />

            {/* Nav */}
            <nav style={styles.nav}>
                {NAV.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        style={({ isActive }) => ({
                            ...styles.navItem,
                            ...(isActive ? styles.navItemActive : {}),
                        })}
                    >
                        <Icon size={15} style={{ flexShrink: 0 }} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div style={styles.sidebarFooter}>
                <div style={styles.footerDot} />
                <div>
                    <div style={styles.footerText}>Government of Karnataka</div>
                    <div style={styles.footerSub}>Directorate of Electronic Delivery of Citizen Services (EDCS)</div>
                </div>
            </div>
        </aside>
    );
}

const styles = {
    sidebar: {
        width: "var(--sidebar-width)",
        minHeight: "100vh",
        background: "var(--gov-sidebar-bg)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        boxShadow: "2px 0 8px rgba(0,0,0,0.18)",
    },
    brand: {
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "20px 16px 16px",
    },
    emblemBox: {
        width: 38,
        height: 38,
        background: "var(--gov-teal)",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    brandTitle: {
        fontSize: 14,
        fontWeight: 700,
        color: "#fff",
        fontFamily: '"Noto Serif", serif',
        lineHeight: 1.2,
    },
    brandSub: {
        fontSize: 9,
        color: "rgba(255,255,255,0.45)",
        marginTop: 3,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
    },
    divider: {
        height: 1,
        background: "rgba(255,255,255,0.08)",
        margin: "0 14px 10px",
    },
    nav: {
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "0 8px",
        flex: 1,
    },
    navItem: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        borderRadius: "var(--radius)",
        color: "rgba(255,255,255,0.55)",
        fontSize: 13,
        fontWeight: 500,
        transition: "all 0.15s ease",
    },
    navItemActive: {
        background: "var(--gov-teal)",
        color: "#fff",
        fontWeight: 600,
    },
    sidebarFooter: {
        padding: "14px 16px",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        alignItems: "center",
        gap: 10,
    },
    footerDot: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "var(--gov-teal)",
        flexShrink: 0,
    },
    footerText: {
        fontSize: 10,
        color: "rgba(255,255,255,0.75)",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
    },
    footerSub: {
        fontSize: 9,
        color: "rgba(255,255,255,0.6)",
        marginTop: 2,
    },
};