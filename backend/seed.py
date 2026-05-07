import uuid
import random
from database import SessionLocal, engine
from models import Base, Candidate, Answer, IntegrityFlag, Summary, Question

Base.metadata.create_all(bind=engine)


# ─────────────────────────────────────────────────────────────────────────────
# QUESTION DATA — trade-specific + general fallback
# ─────────────────────────────────────────────────────────────────────────────
QUESTIONS_DATA = [
    # ─── General (fallback for any trade) ───
    {"question_id": 1, "language": "en", "trade": "general", "text": "What is your work experience?", "acknowledgement": "Thank you for sharing your experience."},
    {"question_id": 2, "language": "en", "trade": "general", "text": "What tools do you use in your work?", "acknowledgement": "Thank you for describing your tools."},
    {"question_id": 3, "language": "en", "trade": "general", "text": "What do you know about safety?", "acknowledgement": "Thank you for your safety awareness."},

    {"question_id": 1, "language": "kn", "trade": "general", "text": "ನಿಮ್ಮ ಕೆಲಸದ ಅನುಭವ ಏನು?", "acknowledgement": "ನಿಮ್ಮ ಅನುಭವ ಹಂಚಿಕೊಂಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದ."},
    {"question_id": 2, "language": "kn", "trade": "general", "text": "ನೀವು ಯಾವ ಉಪಕರಣಗಳನ್ನು ಬಳಸುತ್ತೀರಿ?", "acknowledgement": "ನಿಮ್ಮ ಉಪಕರಣಗಳ ಬಗ್ಗೆ ಧನ್ಯವಾದ."},
    {"question_id": 3, "language": "kn", "trade": "general", "text": "ಸುರಕ್ಷತೆ ಬಗ್ಗೆ ನಿಮಗೆ ಏನು ಗೊತ್ತು?", "acknowledgement": "ಸುರಕ್ಷತೆ ಬಗ್ಗೆ ಧನ್ಯವಾದ."},

    {"question_id": 1, "language": "hi", "trade": "general", "text": "आपका काम का अनुभव क्या है?", "acknowledgement": "आपके अनुभव के लिए धन्यवाद।"},
    {"question_id": 2, "language": "hi", "trade": "general", "text": "आप कौन से उपकरण उपयोग करते हैं?", "acknowledgement": "उपकरण बताने के लिए धन्यवाद।"},
    {"question_id": 3, "language": "hi", "trade": "general", "text": "सुरक्षा के बारे में आप क्या जानते हैं?", "acknowledgement": "सुरक्षा जागरूकता के लिए धन्यवाद।"},

    # ─── Electrician ───
    {"question_id": 1, "language": "en", "trade": "Electrician", "text": "Explain how you would wire a 3-phase electrical panel.", "acknowledgement": "Thank you for your technical explanation."},
    {"question_id": 2, "language": "en", "trade": "Electrician", "text": "What safety precautions do you take when working with live wires?", "acknowledgement": "Thank you for sharing your safety practices."},
    {"question_id": 3, "language": "en", "trade": "Electrician", "text": "How do you troubleshoot a circuit that keeps tripping the breaker?", "acknowledgement": "Thank you for your troubleshooting approach."},

    {"question_id": 1, "language": "kn", "trade": "Electrician", "text": "3-ಫೇಸ್ ವಿದ್ಯುತ್ ಪ್ಯಾನೆಲ್ ಅನ್ನು ಹೇಗೆ ವೈರ್ ಮಾಡುತ್ತೀರಿ ಎಂದು ವಿವರಿಸಿ.", "acknowledgement": "ನಿಮ್ಮ ತಾಂತ್ರಿಕ ವಿವರಣೆಗೆ ಧನ್ಯವಾದ."},
    {"question_id": 2, "language": "kn", "trade": "Electrician", "text": "ಲೈವ್ ವೈರ್‌ಗಳೊಂದಿಗೆ ಕೆಲಸ ಮಾಡುವಾಗ ಯಾವ ಸುರಕ್ಷತಾ ಕ್ರಮಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತೀರಿ?", "acknowledgement": "ಸುರಕ್ಷತಾ ಅಭ್ಯಾಸಗಳಿಗೆ ಧನ್ಯವಾದ."},
    {"question_id": 3, "language": "kn", "trade": "Electrician", "text": "ಬ್ರೇಕರ್ ಮತ್ತೆ ಮತ್ತೆ ಟ್ರಿಪ್ ಆಗುತ್ತಿದ್ದರೆ ಸರ್ಕ್ಯೂಟ್ ಅನ್ನು ಹೇಗೆ ಟ್ರಬಲ್‌ಶೂಟ್ ಮಾಡುತ್ತೀರಿ?", "acknowledgement": "ಟ್ರಬಲ್‌ಶೂಟಿಂಗ್ ವಿಧಾನಕ್ಕೆ ಧನ್ಯವಾದ."},

    {"question_id": 1, "language": "hi", "trade": "Electrician", "text": "3-फेज इलेक्ट्रिकल पैनल को कैसे वायर करेंगे, समझाइए।", "acknowledgement": "आपकी तकनीकी व्याख्या के लिए धन्यवाद।"},
    {"question_id": 2, "language": "hi", "trade": "Electrician", "text": "लाइव तारों के साथ काम करते समय आप क्या सुरक्षा सावधानियां बरतते हैं?", "acknowledgement": "सुरक्षा अभ्यास बताने के लिए धन्यवाद।"},
    {"question_id": 3, "language": "hi", "trade": "Electrician", "text": "अगर ब्रेकर बार-बार ट्रिप हो रहा है तो सर्किट की समस्या कैसे ढूंढेंगे?", "acknowledgement": "समस्या निवारण दृष्टिकोण के लिए धन्यवाद।"},

    # ─── Plumber ───
    {"question_id": 1, "language": "en", "trade": "Plumber", "text": "Describe the steps to fix a leaking pipe joint.", "acknowledgement": "Thank you for your explanation."},
    {"question_id": 2, "language": "en", "trade": "Plumber", "text": "What tools and fittings do you use for PVC and GI pipe work?", "acknowledgement": "Thank you for describing your toolkit."},
    {"question_id": 3, "language": "en", "trade": "Plumber", "text": "How do you ensure proper water pressure in a multi-story building?", "acknowledgement": "Thank you for your technical knowledge."},

    {"question_id": 1, "language": "kn", "trade": "Plumber", "text": "ಸೋರುತ್ತಿರುವ ಪೈಪ್ ಜಾಯಿಂಟ್ ಅನ್ನು ಸರಿಪಡಿಸುವ ಹಂತಗಳನ್ನು ವಿವರಿಸಿ.", "acknowledgement": "ನಿಮ್ಮ ವಿವರಣೆಗೆ ಧನ್ಯವಾದ."},
    {"question_id": 2, "language": "kn", "trade": "Plumber", "text": "PVC ಮತ್ತು GI ಪೈಪ್ ಕೆಲಸಕ್ಕೆ ಯಾವ ಉಪಕರಣಗಳು ಮತ್ತು ಫಿಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಬಳಸುತ್ತೀರಿ?", "acknowledgement": "ನಿಮ್ಮ ಉಪಕರಣಗಳ ಬಗ್ಗೆ ಧನ್ಯವಾದ."},
    {"question_id": 3, "language": "kn", "trade": "Plumber", "text": "ಬಹು ಅಂತಸ್ತಿನ ಕಟ್ಟಡದಲ್ಲಿ ಸರಿಯಾದ ನೀರಿನ ಒತ್ತಡವನ್ನು ಹೇಗೆ ಖಚಿತಪಡಿಸುತ್ತೀರಿ?", "acknowledgement": "ತಾಂತ್ರಿಕ ಜ್ಞಾನಕ್ಕೆ ಧನ್ಯವಾದ."},

    {"question_id": 1, "language": "hi", "trade": "Plumber", "text": "लीक हो रहे पाइप जॉइंट को ठीक करने के चरण बताइए।", "acknowledgement": "आपकी व्याख्या के लिए धन्यवाद।"},
    {"question_id": 2, "language": "hi", "trade": "Plumber", "text": "PVC और GI पाइप के काम के लिए कौन से उपकरण और फिटिंग उपयोग करते हैं?", "acknowledgement": "टूलकिट बताने के लिए धन्यवाद।"},
    {"question_id": 3, "language": "hi", "trade": "Plumber", "text": "बहुमंजिला इमारत में सही पानी का दबाव कैसे सुनिश्चित करते हैं?", "acknowledgement": "तकनीकी ज्ञान के लिए धन्यवाद।"},

    # ─── Welder ───
    {"question_id": 1, "language": "en", "trade": "Welder", "text": "What types of welding have you performed and which method do you prefer?", "acknowledgement": "Thank you for sharing your welding expertise."},
    {"question_id": 2, "language": "en", "trade": "Welder", "text": "What safety equipment is essential when performing arc welding?", "acknowledgement": "Thank you for your safety knowledge."},
    {"question_id": 3, "language": "en", "trade": "Welder", "text": "How do you identify and fix common welding defects like porosity or undercut?", "acknowledgement": "Thank you for your quality control approach."},

    {"question_id": 1, "language": "kn", "trade": "Welder", "text": "ನೀವು ಯಾವ ರೀತಿಯ ವೆಲ್ಡಿಂಗ್ ಮಾಡಿದ್ದೀರಿ ಮತ್ತು ಯಾವ ವಿಧಾನವನ್ನು ಆದ್ಯತೆ ನೀಡುತ್ತೀರಿ?", "acknowledgement": "ವೆಲ್ಡಿಂಗ್ ಪರಿಣತಿ ಹಂಚಿಕೊಂಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದ."},
    {"question_id": 2, "language": "kn", "trade": "Welder", "text": "ಆರ್ಕ್ ವೆಲ್ಡಿಂಗ್ ಮಾಡುವಾಗ ಯಾವ ಸುರಕ್ಷತಾ ಸಾಧನಗಳು ಅಗತ್ಯ?", "acknowledgement": "ಸುರಕ್ಷತಾ ಜ್ಞಾನಕ್ಕೆ ಧನ್ಯವಾದ."},
    {"question_id": 3, "language": "kn", "trade": "Welder", "text": "ಪೊರೊಸಿಟಿ ಅಥವಾ ಅಂಡರ್‌ಕಟ್ ನಂತಹ ಸಾಮಾನ್ಯ ವೆಲ್ಡಿಂಗ್ ದೋಷಗಳನ್ನು ಹೇಗೆ ಗುರುತಿಸುತ್ತೀರಿ ಮತ್ತು ಸರಿಪಡಿಸುತ್ತೀರಿ?", "acknowledgement": "ಗುಣಮಟ್ಟ ನಿಯಂತ್ರಣ ವಿಧಾನಕ್ಕೆ ಧನ್ಯವಾದ."},

    {"question_id": 1, "language": "hi", "trade": "Welder", "text": "आपने किस प्रकार की वेल्डिंग की है और कौन सी विधि पसंद करते हैं?", "acknowledgement": "वेल्डिंग विशेषज्ञता के लिए धन्यवाद।"},
    {"question_id": 2, "language": "hi", "trade": "Welder", "text": "आर्क वेल्डिंग करते समय कौन से सुरक्षा उपकरण आवश्यक हैं?", "acknowledgement": "सुरक्षा ज्ञान के लिए धन्यवाद।"},
    {"question_id": 3, "language": "hi", "trade": "Welder", "text": "पोरोसिटी या अंडरकट जैसी सामान्य वेल्डिंग दोषों को कैसे पहचानते और ठीक करते हैं?", "acknowledgement": "गुणवत्ता नियंत्रण दृष्टिकोण के लिए धन्यवाद।"},
]

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


def seed_questions(db):
    """Seed trade-specific questions (idempotent — skips if already present)."""
    existing = db.query(Question).count()
    if existing > 0:
        print(f"  Questions already seeded ({existing} found), skipping.")
        return

    for q in QUESTIONS_DATA:
        db.add(Question(**q))
    db.flush()
    print(f"  Seeded {len(QUESTIONS_DATA)} questions across 4 trades × 3 languages.")


def seed():
    db = SessionLocal()

    try:
        # Seed questions first
        seed_questions(db)

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