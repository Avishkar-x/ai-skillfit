// ─────────────────────────────────────────────────────────────────────────────
// csvExport.js — export filtered candidate list to CSV
// ─────────────────────────────────────────────────────────────────────────────

export function exportToCSV(candidates, filename = "candidates.csv") {
    const headers = [
        "Name",
        "District",
        "Trade",
        "Language",
        "Final Score",
        "Confidence Score",
        "Fitment Category",
        "Fraud Flag",
    ];

    const rows = candidates.map((c) => [
        c.name,
        c.district,
        c.trade,
        c.language.toUpperCase(),
        c.final_score,
        c.confidence_score,
        c.fitment_category,
        c.integrity_flags?.length > 0 ? c.integrity_flags.map((f) => f.flag_type).join("|") : "None",
    ]);

    const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}