import { getCategoryColor } from "../../utils/scoreUtils";

export default function CategoryBadge({ category, large = false }) {
    const colorClass = getCategoryColor(category);
    return (
        <span
            className={colorClass}
            style={{
                display: "inline-block",
                padding: large ? "6px 14px" : "3px 10px",
                borderRadius: 4,
                fontSize: large ? 14 : 11,
                fontWeight: 600,
                letterSpacing: "0.02em",
            }}
        >
            {category}
        </span>
    );
}