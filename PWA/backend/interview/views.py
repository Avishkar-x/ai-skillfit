"""
SkillSetu — API Views

Endpoints:
  POST /candidate/register  -> Register a new candidate
  GET  /questions            -> List questions for a language
  POST /submit               -> Submit an answer (audio + keyframes)
  GET  /tts                  -> Proxy Google Translate TTS (for Kannada etc.)
"""
import logging
import urllib.parse
import urllib.request
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Candidate, Question, Submission
from .serializers import (
    CandidateRegisterSerializer,
    CandidateResponseSerializer,
    QuestionSerializer,
    SubmitRequestSerializer,
)
from .processors import process_keyframes, transcribe_audio, score_response

logger = logging.getLogger(__name__)


@api_view(['POST'])
def register_candidate(request):
    """
    POST /candidate/register
    Request:  { name, phone_hash, language, district, trade }
    Response: { candidate_id, name }
    """
    serializer = CandidateRegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if Candidate.objects.filter(phone_hash=data['phone_hash']).exists():
        return Response(
            {'error': 'A candidate with this phone number has already registered.'},
            status=status.HTTP_409_CONFLICT,
        )

    candidate = Candidate.objects.create(
        name=data['name'],
        phone_hash=data['phone_hash'],
        language=data.get('language', 'en'),
        district=data.get('district', ''),
        trade=data.get('trade', ''),
    )

    logger.info(f"[REGISTER] New candidate: {candidate.id} ({candidate.name})")
    response = CandidateResponseSerializer(candidate)
    return Response(response.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def list_questions(request):
    """
    GET /questions?language=kn
    Response: [{ question_id, text }, ...]
    """
    language = request.query_params.get('language', 'en')
    questions = Question.objects.filter(language=language)

    if not questions.exists():
        questions = Question.objects.filter(language='en')

    serializer = QuestionSerializer(questions, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
def submit_answer(request):
    """
    POST /submit
    Request:  { candidate_id, question_id, language, audio_base64, keyframes[] }
    Response: { integrity_flag, integrity_details, transcript, scores, category }
    """
    serializer = SubmitRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        candidate = Candidate.objects.get(id=data['candidate_id'])
    except Candidate.DoesNotExist:
        return Response(
            {'error': 'Candidate not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        question = Question.objects.get(question_id=data['question_id'])
    except Question.DoesNotExist:
        return Response(
            {'error': 'Question not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    logger.info(
        f"[SUBMIT] Candidate {candidate.id} -> Q{question.question_id} "
        f"| {len(data['keyframes'])} keyframes | lang={data['language']}"
    )

    # Step 1: Process keyframes (integrity check)
    integrity_details = process_keyframes(data['keyframes'])
    integrity_flag = not all([
        integrity_details.get('frame_1', True),
        integrity_details.get('frame_2', True),
        integrity_details.get('frame_3', True),
    ])

    # Step 2: Transcribe audio
    transcript = transcribe_audio(data['audio_base64'], data['language'])

    # Step 3: Score response
    scores = score_response(transcript, question.text)

    # If integrity failed, zero out scores
    if integrity_flag:
        scores = {
            'relevance_score': 0,
            'completeness_score': 0,
            'clarity_score': 0,
            'final_score': 0,
            'category': '',
        }
        transcript = ''

    # Step 4: Save submission (re-recordings overwrite previous)
    Submission.objects.update_or_create(
        candidate=candidate,
        question=question,
        defaults={
            'language': data['language'],
            'audio_base64': data['audio_base64'],
            'keyframes': data['keyframes'],
            'transcript': transcript,
            'integrity_flag': integrity_flag,
            'integrity_details': integrity_details,
            **scores,
        },
    )

    # Step 5: Build response
    response_data = {
        'integrity_flag': integrity_flag,
        'integrity_details': integrity_details,
        'transcript': transcript,
        **scores,
    }

    logger.info(
        f"[SUBMIT] Result: integrity={'FAIL' if integrity_flag else 'PASS'} "
        f"| score={scores.get('final_score', 0)}"
    )

    return Response(response_data, status=status.HTTP_200_OK)


def tts_proxy(request):
    """
    GET /tts?q=text&tl=kn
    Proxies Google Translate TTS server-side to bypass CORS.
    Returns audio/mpeg stream.
    """
    text = request.GET.get('q', '')
    lang = request.GET.get('tl', 'en')

    if not text:
        return HttpResponse('Missing "q" parameter', status=400)

    params = urllib.parse.urlencode({
        'ie': 'UTF-8',
        'q': text,
        'tl': lang,
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
            return HttpResponse(
                audio_data,
                content_type='audio/mpeg',
                headers={
                    'Cache-Control': 'public, max-age=86400',
                },
            )
    except Exception as e:
        logger.error(f'[TTS] Proxy error: {e}')
        return HttpResponse(f'TTS proxy error: {e}', status=502)
