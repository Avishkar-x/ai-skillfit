import { getLanguageLabel, getLanguageColor } from "../../utils/scoreUtils";

export default function LanguageBadge({ language }) {
    const colorClass = getLanguageColor(language);
    const label = getLanguageLabel(language);
    return (
        <span
            className={colorClass}
            style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 3,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.05em",
            }}
        >
            {label}
        </span>
    );
}