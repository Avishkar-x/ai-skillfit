from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Candidate, Answer, IntegrityFlag, Summary

router = APIRouter()


# -----------------------------
# DB Dependency
# -----------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------
# Schemas
# -----------------------------
class CandidateRegister(BaseModel):
    name: str
    phone_hash: str
    language: str
    district: str
    trade: str


class AnswerSubmit(BaseModel):
    candidate_id: str
    language: str
    question_id: int
    audio_b64: str
    keyframe_b64: str


# -----------------------------
# Questions Data
# -----------------------------

# NOTE:DEMO ONLY
# Questions are currently hardcoded for demo stability and faster iteration.
# In production, these will be dynamically fetched from a database or question service,
# enabling role-specific, multilingual, and configurable interview flows.
QUESTIONS = {
    "kn": [
        {
            "question_id": 1,
            "text": "ನಿಮ್ಮ ಕೆಲಸದ ಅನುಭವ ಏನು?",
            "acknowledgement": None
        },
        {
            "question_id": 2,
            "text": "ನೀವು ಯಾವ ಉಪಕರಣಗಳನ್ನು ಬಳಸುತ್ತೀರಿ?",
            "acknowledgement": "ಧನ್ಯವಾದಗಳು! ಇನ್ನೊಂದು ಪ್ರಶ್ನೆ ನಿಮಗಾಗಿ."
        },
        {
            "question_id": 3,
            "text": "ಸುರಕ್ಷತೆ ಬಗ್ಗೆ ನಿಮಗೆ ಏನು ಗೊತ್ತು?",
            "acknowledgement": "ತುಂಬಾ ಚೆನ್ನಾಗಿ ಹೇಳಿದಿರಿ! ಕೊನೆಯ ಪ್ರಶ್ನೆ."
        },
    ],
    "hi": [
        {
            "question_id": 1,
            "text": "आपका काम का अनुभव क्या है?",
            "acknowledgement": None
        },
        {
            "question_id": 2,
            "text": "आप कौन से उपकरण उपयोग करते हैं?",
            "acknowledgement": "धन्यवाद! अब एक और सवाल।"
        },
        {
            "question_id": 3,
            "text": "सुरक्षा के बारे में आप क्या जानते हैं?",
            "acknowledgement": "बहुत अच्छा! अब आखिरी सवाल।"
        },
    ],
    "en": [
        {
            "question_id": 1,
            "text": "What is your work experience?",
            "acknowledgement": None
        },
        {
            "question_id": 2,
            "text": "What tools do you use?",
            "acknowledgement": "Great answer! Here is another question for you."
        },
        {
            "question_id": 3,
            "text": "What do you know about safety?",
            "acknowledgement": "Well done! Here is your final question."
        },
    ]
}

# DEMO ONLY: Pre-generated summaries served from memory
# Production: Mistral 7B generates from structured English inputs
# Raw transcripts are never passed to Mistral
SUMMARIES = {
    "Job Ready":          "Candidate demonstrated strong understanding across all questions. Recommended for immediate placement.",
    "Needs Training":     "Candidate showed basic understanding but needs upskilling before placement.",
    "Needs Verification": "Responses were inconsistent. Manual verification recommended.",
    "Low Quality":        "Very low response quality observed. Foundational training required.",
    "Suspected Fraud":    "Integrity violation detected. Candidate flagged for officer review.",
}


# -----------------------------
# GET /questions
# -----------------------------
@router.get("/questions")
def get_questions(language: str = "kn"):
    language = language.lower().strip()
    if language not in QUESTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language '{language}'. Supported: kn, hi, en"
        )
    return QUESTIONS[language]


# -----------------------------
# POST /candidate/register
# -----------------------------
@router.post("/candidate/register")
def register_candidate(data: CandidateRegister, db: Session = Depends(get_db)):
    candidate = Candidate(
        name             = data.name,
        phone_hash       = data.phone_hash,
        language         = data.language,
        district         = data.district,
        trade            = data.trade,
        fitment_category = "Pending",
        final_score      = 0.0,
        confidence_score = 0.0,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    return {
        "candidate_id": candidate.id,
        "name":         candidate.name
    }


# -----------------------------
# POST /submit
# -----------------------------
@router.post("/submit")
def submit_answer(data: AnswerSubmit, db: Session = Depends(get_db)):

    # --- DEMO HACK: flag on Q2 first attempt only ---
    existing_q2 = db.query(Answer).filter(
        Answer.candidate_id == data.candidate_id,
        Answer.question_id  == 2
    ).count()

    # DEMO ONLY: Hardcoded integrity flag on Q2 first attempt
    # to demonstrate fraud detection flow in demo video
    # Replace with real MediaPipe + ArcFace check in production
    if data.question_id == 2 and existing_q2 == 0:
        db.add(IntegrityFlag(
            candidate_id = data.candidate_id,
            flag_type    = "multiple_faces"
        ))
        db.commit()
        return {
            "status":         "received",
            "question_id":    2,
            "integrity_flag": True,
            "flag_type":      "multiple_faces"
        }

    # PLACEHOLDER: Replace with Person 1's assess() function
    # when STT pipeline is integrated
    # Expected return: {transcript, relevance, completeness, clarity}
    result = {
        "transcript":   "Mock transcript — Person 1 pending",
        "relevance":    7.5,
        "completeness": 6.8,
        "clarity":      7.2
    }

    # --- Per question template summary ---
    rel_label  = "relevant"  if result["relevance"]    >= 5 else "not relevant"
    comp_label = "complete"  if result["completeness"] >= 5 else "incomplete"
    clar_label = "clear"     if result["clarity"]      >= 5 else "unclear"
    per_q_summary = f"Response was {rel_label} and {comp_label}. Communication was {clar_label}."

    # --- Save answer ---
    answer = Answer(
        candidate_id         = data.candidate_id,
        question_id          = data.question_id,
        transcript           = result["transcript"],
        relevance_score      = result["relevance"],
        completeness_score   = result["completeness"],
        clarity_score        = result["clarity"],
        per_question_summary = per_q_summary
    )
    db.add(answer)
    db.flush()

    # --- Check if all 3 answers submitted ---
    answer_count = db.query(Answer).filter(
        Answer.candidate_id == data.candidate_id
    ).count()

    if answer_count == 3:
        all_answers = db.query(Answer).filter(
            Answer.candidate_id == data.candidate_id
        ).all()

        avg_r  = sum(a.relevance_score    for a in all_answers) / 3
        avg_c  = sum(a.completeness_score for a in all_answers) / 3
        avg_cl = sum(a.clarity_score      for a in all_answers) / 3

        final_score = round(
            (avg_r * 0.4) + (avg_c * 0.35) + (avg_cl * 0.25), 2
        )

        # --- Classification ---
        if final_score >= 7.5:
            category = "Job Ready"
        elif final_score >= 5.0:
            category = "Needs Training"
        elif final_score >= 3.0:
            category = "Needs Verification"
        else:
            category = "Low Quality"

        # --- Override if fraud flag exists ---
        fraud_flag = db.query(IntegrityFlag).filter(
            IntegrityFlag.candidate_id == data.candidate_id
        ).first()
        if fraud_flag:
            category = "Suspected Fraud"

        confidence_score = round(final_score * (0.5 if fraud_flag else 1.0), 2)

        # --- Update candidate ---
        candidate = db.query(Candidate).filter(
            Candidate.id == data.candidate_id
        ).first()
        candidate.fitment_category = category
        candidate.final_score      = final_score
        candidate.confidence_score = confidence_score

        # --- Save summary ---
        db.add(Summary(
            candidate_id    = data.candidate_id,
            overall_summary = SUMMARIES[category]
        ))

        db.commit()

        return {
            "status":           "complete",
            "question_id":      data.question_id,
            "integrity_flag":   bool(fraud_flag),
            "fitment_category": category,
            "final_score":      final_score
        }

    db.commit()

    return {
        "status":         "received",
        "question_id":    data.question_id,
        "integrity_flag": False
    }