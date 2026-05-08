from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Candidate, Answer, IntegrityFlag, Summary, Question
from services.integrity import check_integrity
import base64
import json
import logging
import urllib.parse
import urllib.request
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../stt-assesment'))
from assess import assess as stt_assess

# Media storage directory
MEDIA_DIR = os.path.join(os.path.dirname(__file__), '..', 'media')
os.makedirs(MEDIA_DIR, exist_ok=True)

logger = logging.getLogger(__name__)
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
    audio_base64: str
    keyframes: list[str]




# -----------------------------
# GET /questions
# -----------------------------
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

@router.get("/questions")
def get_questions(language: str = "kn", trade: str = None, db: Session = Depends(get_db)):
    language = language.lower().strip()
    
    if language in QUESTIONS:
        return QUESTIONS[language]
    
    # Fallback to English if language not found
    return QUESTIONS.get("en", [])


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
    print(f"[SUBMIT] Received: candidate={data.candidate_id[:8]}... question_id={data.question_id} language={data.language}")

    integrity_result = check_integrity(data.keyframes)
    flag_raised      = integrity_result["flag_raised"]
    flag_type        = integrity_result["flag_type"]
    per_frame        = integrity_result.get("per_frame", {})

    if flag_raised:
        db.add(IntegrityFlag(
            candidate_id = data.candidate_id,
            flag_type    = flag_type
        ))
        db.commit()
        return {
            "status":            "received",
            "question_id":       data.question_id,
            "integrity_flag":    True,
            "flag_type":         flag_type,
            "integrity_details": {
                **per_frame,
                "failure_reason": flag_type,
            },
        }
    
    # Fetch candidate trade for keyword matching
    candidate = db.query(Candidate).filter(
        Candidate.id == data.candidate_id
    ).first()

    # STT + Scoring via stt/assess.py
    result = stt_assess(
        data.audio_base64,
        data.language,
        data.question_id,
        candidate.trade
    )

    # --- Per question template summary ---
    rel_label  = "relevant"  if result["relevance"]    >= 5 else "not relevant"
    comp_label = "complete"  if result["completeness"] >= 5 else "incomplete"
    clar_label = "clear"     if result["clarity"]      >= 5 else "unclear"
    per_q_summary = f"Response was {rel_label} and {comp_label}. Communication was {clar_label}."

    # --- Save media files ---
    candidate_dir = os.path.join(MEDIA_DIR, data.candidate_id)
    os.makedirs(candidate_dir, exist_ok=True)

    # Save audio
    audio_filename = f"q{data.question_id}_audio.webm"
    audio_path = os.path.join(candidate_dir, audio_filename)
    with open(audio_path, 'wb') as f:
        f.write(base64.b64decode(data.audio_base64))
    audio_url = f"/media/{data.candidate_id}/{audio_filename}"

    # Save keyframes
    kf_urls = []
    for idx, kf_b64 in enumerate(data.keyframes):
        kf_filename = f"q{data.question_id}_frame{idx + 1}.jpg"
        kf_path = os.path.join(candidate_dir, kf_filename)
        with open(kf_path, 'wb') as f:
            f.write(base64.b64decode(kf_b64))
        kf_urls.append(f"/media/{data.candidate_id}/{kf_filename}")

    # --- Save answer ---
    answer = Answer(
        candidate_id         = data.candidate_id,
        question_id          = data.question_id,
        transcript           = result["transcript"],
        relevance_score      = result["relevance"],
        completeness_score   = result["completeness"],
        clarity_score        = result["clarity"],
        per_question_summary = per_q_summary,
        audio_url            = audio_url,
        keyframe_urls        = json.dumps(kf_urls),
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

        # --- Generate Summary (Hardcoded templates) ---
        SUMMARIES = {
            "Job Ready":          "Candidate demonstrated strong understanding across all questions. Recommended for immediate placement.",
            "Needs Training":     "Candidate showed basic understanding but needs upskilling before placement.",
            "Needs Verification": "Responses were inconsistent. Manual verification recommended.",
            "Low Quality":        "Very low response quality observed. Foundational training required.",
            "Suspected Fraud":    "Integrity violation detected. Candidate flagged for officer review.",
        }
        llm_summary = SUMMARIES.get(category, "Review required.")

        db.add(Summary(
            candidate_id    = data.candidate_id,
            overall_summary = llm_summary
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


# -----------------------------
# GET /tts  (Google Translate TTS proxy)
# Bypasses CORS for Kannada / Hindi audio
# -----------------------------
@router.get("/tts")
def tts_proxy(
    q: str = Query(..., description="Text to synthesize"),
    tl: str = Query("en", description="Target language code (kn, hi, en)")
):
    if not q.strip():
        raise HTTPException(status_code=400, detail='Missing "q" parameter')

    params = urllib.parse.urlencode({
        'ie': 'UTF-8',
        'q': q,
        'tl': tl,
        'client': 'tw-ob',
    })
    url = f'https://translate.google.com/translate_tts?{params}'

    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://translate.google.com/',
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            audio_data = resp.read()
            return Response(
                content=audio_data,
                media_type='audio/mpeg',
                headers={'Cache-Control': 'public, max-age=86400'},
            )
    except Exception as e:
        logger.error(f'[TTS] Proxy error: {e}')
        raise HTTPException(status_code=502, detail=f'TTS proxy error: {e}')