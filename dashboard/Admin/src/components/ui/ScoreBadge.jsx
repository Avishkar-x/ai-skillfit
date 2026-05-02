import { getScoreColor } from "../../utils/scoreUtils";

export default function ScoreBadge({ score, large = false }) {
    const colorClass = getScoreColor(score);
    return (
        <span
            className={colorClass}
            style={{
                display: "inline-block",
                padding: large ? "6px 14px" : "3px 10px",
                borderRadius: 20,
                fontSize: large ? 20 : 12,
                fontWeight: 700,
                letterSpacing: "0.01em",
            }}
        >
            {score?.toFixed(1)}
        </span>
    );
}