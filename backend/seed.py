import uuid
import random
from database import SessionLocal, engine
from models import Base, Candidate, Answer, IntegrityFlag, Summary

Base.metadata.create_all(bind=engine)

DISTRICTS = ["Bengaluru", "Mysuru", "Hubli"]
TRADES = ["Electrician", "Plumber", "Welder"]
LANGUAGES = ["kn", "hi", "en"]
CATEGORIES = ["Job Ready", "Needs Training", "Needs Verification", "Low Quality", "Suspected Fraud"]

CATEGORY_SCORE_RANGE = {
    "Job Ready":          (7.5, 9.5),
    "Needs Training":     (5.0, 7.4),
    "Needs Verification": (3.0, 4.9),
    "Low Quality":        (1.0, 2.9),
    "Suspected Fraud":    (0.0, 0.0),
}

SUMMARIES = {
    "Job Ready": [
        "Candidate demonstrated strong understanding across all questions. Communication was clear and confident. Recommended for immediate placement.",
        "Responses were relevant and complete. Candidate showed solid trade knowledge with good clarity. Job ready.",
    ],
    "Needs Training": [
        "Candidate showed basic understanding but lacked depth in technical areas. Short-term training recommended before placement.",
        "Responses were partially relevant. Candidate needs upskilling in core trade concepts before being considered job ready.",
    ],
    "Needs Verification": [
        "Responses were inconsistent. Some answers showed knowledge gaps. Manual verification of credentials recommended.",
        "Candidate provided unclear responses in multiple questions. Recommend in-person verification before further processing.",
    ],
    "Low Quality": [
        "Responses were largely irrelevant and incomplete. Significant gaps in trade knowledge observed. Not suitable for current roles.",
        "Very low response quality across all questions. Candidate may require foundational training before re-assessment.",
    ],
    "Suspected Fraud": [
        "Integrity check failed. Duplicate face detected or multiple faces present during interview. Routed to manual verification.",
        "Suspicious submission detected. Candidate flagged for integrity violation. Officer review required.",
    ],
}

TRANSCRIPTS = {
    "kn": [
        "ನಾನು ವಿದ್ಯುತ್ ಸ್ಥಾಪನೆ ಮತ್ತು ದುರಸ್ತಿ ಕೆಲಸ ಮಾಡುತ್ತೇನೆ.",
        "ನಾನು ಪೈಪ್ ಜೋಡಣೆ ಮತ್ತು ನೀರು ಸರಬರಾಜು ವ್ಯವಸ್ಥೆಯಲ್ಲಿ ಕೆಲಸ ಮಾಡಿದ್ದೇನೆ.",
        "ನಾನು ವೆಲ್ಡಿಂಗ್ ಮಾಡುವಾಗ ಸುರಕ್ಷತಾ ಸಾಧನಗಳನ್ನು ಬಳಸುತ್ತೇನೆ.",
    ],
    "hi": [
        "मैं बिजली की फिटिंग और मरम्मत का काम करता हूं।",
        "मैंने पाइपलाइन और जल आपूर्ति प्रणाली में काम किया है।",
        "वेल्डिंग करते समय मैं सुरक्षा उपकरण पहनता हूं।",
    ],
    "en": [
        "I have experience in electrical installation and repair work.",
        "I have worked on pipeline fitting and water supply systems.",
        "I always use safety equipment when performing welding tasks.",
    ],
}

FLAG_TYPES = ["no_face", "multiple_faces", "duplicate"]

NAMES = [
    "Ravi Kumar", "Suresh Babu", "Manjunath K", "Priya Devi", "Anand S",
    "Deepak R", "Kavitha M", "Venkatesh N", "Lakshmi B", "Arjun T",
    "Santhosh P", "Divya H", "Kiran G", "Naveen J", "Rekha C",
    "Mahesh D", "Usha V", "Ganesh L", "Pooja S", "Ramesh Y",
    "Sunita K", "Vijay M", "Anitha R", "Mohan B", "Shanta P",
]


def random_score_for_category(category):
    if category == "Suspected Fraud":
        return 0.0, 0.0, 0.0
    low, high = CATEGORY_SCORE_RANGE[category]
    relevance     = round(random.uniform(low, high), 1)
    completeness  = round(random.uniform(low, high), 1)
    clarity       = round(random.uniform(low, high), 1)
    return relevance, completeness, clarity


def compute_final_score(relevance, completeness, clarity):
    return round((relevance * 0.4) + (completeness * 0.35) + (clarity * 0.25), 2)


def per_question_summary(relevance, completeness, clarity):
    rel_label  = "relevant"      if relevance    >= 5 else "not relevant"
    comp_label = "complete"      if completeness >= 5 else "incomplete"
    clar_label = "clear"         if clarity      >= 5 else "unclear"
    return f"Response was {rel_label} and {comp_label}. Communication was {clar_label}."


def seed():
    db = SessionLocal()

    try:
        candidates_created = []

        category_pool = (CATEGORIES * 12)[:60]
        random.shuffle(category_pool)

        for i in range(50):
            language     = random.choice(LANGUAGES)
            category     = category_pool[i]
            name         = random.choice(NAMES) + f" {i+1}"

            candidate = Candidate(
                name             = name,
                language         = language,
                district         = random.choice(DISTRICTS),
                trade            = random.choice(TRADES),
                phone_hash       = str(uuid.uuid4())[:16],
                fitment_category = category,
                final_score      = 0.0,
                confidence_score = random.randint(40, 100),
            )
            db.add(candidate)
            db.flush()
            candidates_created.append((candidate.id, language, category))

            total_relevance    = 0
            total_completeness = 0
            total_clarity      = 0

            for q_id in range(1, 4):
                relevance, completeness, clarity = random_score_for_category(category)
                total_relevance    += relevance
                total_completeness += completeness
                total_clarity      += clarity

                transcript = random.choice(TRANSCRIPTS[language])
                summary    = per_question_summary(relevance, completeness, clarity)

                answer = Answer(
                    candidate_id        = candidate.id,
                    question_id         = q_id,
                    transcript          = transcript,
                    relevance_score     = relevance,
                    completeness_score  = completeness,
                    clarity_score       = clarity,
                    per_question_summary= summary,
                )
                db.add(answer)

            avg_r  = total_relevance    / 3
            avg_c  = total_completeness / 3
            avg_cl = total_clarity      / 3
            candidate.final_score = compute_final_score(avg_r, avg_c, avg_cl)

            if category == "Suspected Fraud":
                flag = IntegrityFlag(
                    candidate_id = candidate.id,
                    flag_type    = random.choice(FLAG_TYPES),
                )
                db.add(flag)

            summary_text = random.choice(SUMMARIES[category])
            summary = Summary(
                candidate_id     = candidate.id,
                overall_summary  = summary_text,
            )
            db.add(summary)

        db.commit()
        print(f"Seeded 50 candidates successfully.")

    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed()