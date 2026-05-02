import { useState, useEffect } from "react";
import { fetchCandidates } from "../api/candidates";
import StatCard from "../components/ui/StatCard";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import { Users, AlertTriangle, CheckCircle, BarChart2 } from "lucide-react";

const CATEGORY_COLORS = {
    "Job Ready": "#046a38",
    "Needs Training": "#c79200",
    "Needs Verification": "#003087",
    "Low Quality": "#cc5500",
    "Suspected Fraud": "#c0392b",
};

export default function StatsPanel() {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCandidates().then(setCandidates).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div style={{ padding: 60, textAlign: "center", color: "var(--gov-text-muted)" }}>Loading statistics…</div>;
    }

    // ── Derived stats ─────────────────────────────────────────────────────────
    const total = candidates.length;
    const fraudCount = candidates.filter((c) => c.fitment_category === "Suspected Fraud" || (c.integrity_flags?.length > 0)).length;
    const jobReadyCount = candidates.filter((c) => c.fitment_category === "Job Ready").length;

    // Bar chart: candidates per district
    const districtMap = {};
    candidates.forEach((c) => {
        districtMap[c.district] = (districtMap[c.district] || 0) + 1;
    });
    const districtData = Object.entries(districtMap).map(([district, count]) => ({ district, count }));

    // Pie chart: category distribution
    const categoryMap = {};
    candidates.forEach((c) => {
        categoryMap[c.fitment_category] = (categoryMap[c.fitment_category] || 0) + 1;
    });
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    return (
        <div>
            {/* ── Count cards ───────────────────────────────────────────────── */}
            <div style={s.cardGrid}>
                <StatCard label="Total Candidates" value={total} accent="var(--gov-navy)" icon={Users} />
                <StatCard label="Job Ready" value={jobReadyCount} accent="var(--gov-green)" icon={CheckCircle} />
                <StatCard label="Suspected Fraud" value={fraudCount} accent="#c0392b" icon={AlertTriangle} />
                <StatCard
                    label="Pass Rate"
                    value={total > 0 ? `${Math.round((jobReadyCount / total) * 100)}%` : "—"}
                    accent="var(--gov-saffron)"
                    icon={BarChart2}
                />
            </div>

            {/* ── Charts row ────────────────────────────────────────────────── */}
            <div style={s.chartsRow}>
                {/* Bar chart */}
                <div style={s.chartCard}>
                    <div style={s.chartHeader}>
                        <div style={s.chartTitle}>Candidates per District</div>
                        <div style={s.chartSub}>Total count by district</div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={districtData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf4" vertical={false} />
                            <XAxis dataKey="district" tick={{ fontSize: 12, fill: "#5a6a85" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#5a6a85" }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{
                                    background: "#fff",
                                    border: "1px solid #d0d9e8",
                                    borderRadius: 6,
                                    fontSize: 12,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                }}
                                cursor={{ fill: "#f0f4f8" }}
                            />
                            <Bar dataKey="count" name="Candidates" fill="var(--gov-navy)" radius={[4, 4, 0, 0]} maxBarSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie chart */}
                <div style={s.chartCard}>
                    <div style={s.chartHeader}>
                        <div style={s.chartTitle}>Category Distribution</div>
                        <div style={s.chartSub}>Fitment breakdown across all candidates</div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={CATEGORY_COLORS[entry.name] || "#888"}
                                        stroke="#fff"
                                        strokeWidth={2}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: "#fff",
                                    border: "1px solid #d0d9e8",
                                    borderRadius: 6,
                                    fontSize: 12,
                                }}
                            />
                            <Legend
                                iconType="circle"
                                iconSize={10}
                                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Category breakdown table ──────────────────────────────────── */}
            <div style={s.tableCard}>
                <div style={s.chartHeader}>
                    <div style={s.chartTitle}>Category Breakdown</div>
                    <div style={s.chartSub}>Detailed count and percentage per fitment category</div>
                </div>
                <table style={s.table}>
                    <thead>
                        <tr style={s.thead}>
                            <th style={s.th}>Category</th>
                            <th style={{ ...s.th, textAlign: "center" }}>Count</th>
                            <th style={{ ...s.th, textAlign: "center" }}>Percentage</th>
                            <th style={s.th}>Distribution</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categoryData.map(({ name, value }) => (
                            <tr key={name} style={s.row}>
                                <td style={s.td}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                        <span
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: "50%",
                                                background: CATEGORY_COLORS[name] || "#888",
                                                display: "inline-block",
                                                flexShrink: 0,
                                            }}
                                        />
                                        {name}
                                    </span>
                                </td>
                                <td style={{ ...s.td, textAlign: "center", fontWeight: 700 }}>{value}</td>
                                <td style={{ ...s.td, textAlign: "center" }}>
                                    {((value / total) * 100).toFixed(1)}%
                                </td>
                                <td style={s.td}>
                                    <div style={s.barTrack}>
                                        <div
                                            style={{
                                                ...s.barFill,
                                                width: `${(value / total) * 100}%`,
                                                background: CATEGORY_COLORS[name] || "#888",
                                            }}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
    cardGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 14,
        marginBottom: 20,
    },
    chartsRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        marginBottom: 20,
    },
    chartCard: {
        background: "#fff",
        border: "1px solid var(--gov-border)",
        borderRadius: "var(--radius)",
        padding: "16px 20px",
        boxShadow: "var(--shadow)",
    },
    chartHeader: {
        marginBottom: 12,
    },
    chartTitle: {
        fontSize: 13,
        fontWeight: 700,
        color: "var(--gov-navy)",
        fontFamily: '"Noto Serif", serif',
    },
    chartSub: {
        fontSize: 11,
        color: "var(--gov-text-muted)",
        marginTop: 2,
    },
    tableCard: {
        background: "#fff",
        border: "1px solid var(--gov-border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        boxShadow: "var(--shadow)",
        padding: "16px 20px 0",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        marginTop: 8,
    },
    thead: {
        background: "var(--gov-navy)",
    },
    th: {
        padding: "9px 14px",
        fontSize: 10,
        fontWeight: 700,
        color: "rgba(255,255,255,0.85)",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        textAlign: "left",
    },
    row: {
        borderBottom: "1px solid #eef0f5",
    },
    td: {
        padding: "11px 14px",
        fontSize: 13,
        color: "var(--gov-text)",
    },
    barTrack: {
        background: "#eef0f5",
        borderRadius: 4,
        height: 8,
        overflow: "hidden",
    },
    barFill: {
        height: "100%",
        borderRadius: 4,
        transition: "width 0.5s ease",
    },
};