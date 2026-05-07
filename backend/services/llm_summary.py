"""
SkillSetu — LLM Summary Generator

Uses Google Gemini API (google-genai) to generate personalized candidate
assessment summaries based on their interview transcripts and scores.

Requires GEMINI_API_KEY in environment/.env file.
Falls back to template-based summaries if the API is unavailable.
"""
import logging
import os

logger = logging.getLogger(__name__)

# Try to import the new Gemini SDK
try:
    from google import genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("[LLM] google-genai not installed. Using template fallback.")


# ─────────────────────────────────────────────────────────────────────────────
# TEMPLATE FALLBACK (used when Gemini API key is missing or call fails)
# ─────────────────────────────────────────────────────────────────────────────
TEMPLATE_SUMMARIES = {
    "Job Ready":          "Candidate demonstrated strong understanding across all questions. Recommended for immediate placement.",
    "Needs Training":     "Candidate showed basic understanding but needs upskilling before placement.",
    "Needs Verification": "Responses were inconsistent. Manual verification recommended.",
    "Low Quality":        "Very low response quality observed. Foundational training required.",
    "Suspected Fraud":    "Integrity violation detected. Candidate flagged for officer review.",
}


def _build_prompt(candidate_name: str, trade: str, category: str,
                  answers: list, final_score: float) -> str:
    """Build a structured prompt for the LLM."""
    answers_text = ""
    for a in answers:
        answers_text += f"""
Question {a['question_id']}:
  Transcript: {a['transcript']}
  Relevance: {a['relevance_score']}/10
  Completeness: {a['completeness_score']}/10
  Clarity: {a['clarity_score']}/10
"""

    return f"""You are an AI assessment officer for a government skilling program in Karnataka, India.
A candidate has just completed a 3-question voice interview. Generate a concise 2-3 sentence
assessment summary for the HR/admin dashboard.

Candidate: {candidate_name}
Trade: {trade}
Final Score: {final_score}/10
Fitment Category: {category}

Interview Responses:
{answers_text}

Rules:
- Write in professional English (this is for the admin dashboard, not the candidate).
- Be specific about what the candidate knew or lacked — don't be generic.
- If the category is "Suspected Fraud", mention the integrity violation.
- Keep it to exactly 2-3 sentences. No bullet points.
- Do not include the score number in the summary.
"""


def generate_summary(candidate_name: str, trade: str, category: str,
                     answers: list, final_score: float) -> str:
    """
    Generate an AI-powered candidate summary using Gemini.
    Falls back to templates if API is unavailable.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")

    if not GEMINI_AVAILABLE or not api_key:
        logger.info(f"[LLM] Using template fallback for category: {category}")
        return TEMPLATE_SUMMARIES.get(category, "Assessment pending.")

    try:
        client = genai.Client(api_key=api_key)

        prompt = _build_prompt(candidate_name, trade, category, answers, final_score)

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        summary = response.text.strip()

        # Sanity check — if response is too long or empty, fallback
        if not summary or len(summary) > 500:
            logger.warning(f"[LLM] Unexpected response length ({len(summary)}), using fallback")
            return TEMPLATE_SUMMARIES.get(category, "Assessment pending.")

        logger.info(f"[LLM] Generated summary for {candidate_name}: {summary[:80]}...")
        return summary

    except Exception as e:
        logger.error(f"[LLM] Gemini API error: {e}")
        return TEMPLATE_SUMMARIES.get(category, "Assessment pending.")
