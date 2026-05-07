/*
  BACKEND INTEGRATION NOTES — Feature Updates:

  1. /submit now sends keyframes (array of 3 base64 JPEG strings)
     instead of keyframe_base64 (single string).
     Update backend to accept: keyframes: string[]

  2. /submit response must now include integrity_details:
     {
       frame_1: boolean,  // true = passed
       frame_2: boolean,
       frame_3: boolean,
       failure_reason: "multiple_faces" | "no_face" | "duplicate" |
                       "low_quality" | null
     }

  3. Run MediaPipe checks on all 3 frames independently.
     Set integrity_flag: true if ANY frame fails.
     Populate failure_reason with the most critical failure found.
*/
/**
 * SkillSetu — AI Video Interview PWA
 *
 * PHASES: LANGUAGE_SELECT → REGISTRATION → LOADING_QUESTIONS →
 *         SPEAKING → RECORDING → CHECKING_AUDIO → SUBMITTING →
 *         (INTEGRITY_WARNING | RESULT | SUBMIT_ERROR)
 *         CHECKING_AUDIO → SILENT_AUDIO → RECORDING (retry)
 *         INTEGRITY_WARNING → RECORDING | TERMINATED
 *         RESULT → SPEAKING | COMPLETE
 *         COMPLETE → LANGUAGE_SELECT
 *         TERMINATED → (end state)
 *
 * API Endpoints:
 *   POST /candidate/register  → { candidate_id, name }
 *   GET  /questions?language=  → [{ question_id, text }, ...]
 *   POST /submit              → { integrity_flag, integrity_details, transcript, scores... }
 *
 * DEV_MODE toggle: line ~49  (const DEV_MODE = false)
 * Stream cleanup : Interview.jsx useEffect cleanup + stopStream() after keyframe
 * Mock data      : src/constants.js
 */
import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { PHASES, BASE_URL, mockQuestions, mockRegisterResponse } from './constants'
import { LanguageSelect, Registration } from './Screens'
import { LoadingQuestions, LoadingError, CompleteScreen, TerminatedScreen, InterviewScreen } from './Interview'

const DEV_MODE = false

// Shuffle utility (Fisher-Yates) to randomize question order
const shuffleArray = (arr) => {
  const shuffled = [...arr] // never mutate original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function App() {
  // ── Recover session ────────────────────────────────────────────────────────
  const savedId = sessionStorage.getItem('candidate_id') || ''
  const savedLang = sessionStorage.getItem('language') || null
  const savedIdx = parseInt(sessionStorage.getItem('question_index') || '0', 10)
  const savedName = sessionStorage.getItem('candidate_name') || ''

  const [phase, setPhase] = useState(
    savedId && savedLang ? PHASES.LOADING_QUESTIONS : PHASES.LANGUAGE_SELECT
  )
  const [language, setLanguage] = useState(savedLang)
  const [candidateId, setCandidateId] = useState(savedId)
  const [candidateName, setCandidateName] = useState(savedName)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(savedIdx)
  const [isRegistering, setIsRegistering] = useState(false)

  // DEV_MODE console log
  useEffect(() => {
    if (DEV_MODE) console.log('DEV_MODE active — using mock data')
  }, [])

  // ── Fetch questions when entering LOADING_QUESTIONS ────────────────────────
  useEffect(() => {
    if (phase !== PHASES.LOADING_QUESTIONS) return
    let cancelled = false

    const load = async () => {
      if (DEV_MODE) {
        await new Promise((r) => setTimeout(r, 600))
        if (!cancelled) {
          const rawQuestions = mockQuestions[language] || mockQuestions.en
          setQuestions(shuffleArray(rawQuestions))
          setPhase(PHASES.SPEAKING)
        }
        return
      }
      try {
        // Real API: GET /questions?language=kn
        const res = await fetch(`${BASE_URL}/questions?language=${language}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (!cancelled) {
          // API returns flat array: [{ question_id, text }, ...]
          setQuestions(shuffleArray(data))
          setPhase(PHASES.SPEAKING)
        }
      } catch {
        if (!cancelled) setPhase(PHASES.LOADING_ERROR)
      }
    }

    load()
    return () => { cancelled = true }
  }, [phase, language])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleLanguageSelect = (lang) => {
    setLanguage(lang)
    sessionStorage.setItem('language', lang)
    setPhase(PHASES.REGISTRATION)
  }

  // POST /candidate/register
  const handleRegister = async (formData) => {
    // TODO: Remove this local guard once backend ArcFace duplicate
    // detection is confirmed working end-to-end
    const previousCandidates = JSON.parse(
      sessionStorage.getItem('submitted_candidates') || '[]'
    )
    if (previousCandidates.includes(formData.phone_hash)) {
      toast.error(
        'This phone number has already completed an interview on this device.',
        { duration: 4000 }
      )
      return
    }

    setIsRegistering(true)

    if (DEV_MODE) {
      await new Promise((r) => setTimeout(r, 1000))
      console.log('[DEV] Registration payload:', formData)
      const { candidate_id, name } = mockRegisterResponse
      setCandidateId(candidate_id)
      setCandidateName(name)
      setCurrentIndex(0)
      sessionStorage.setItem('candidate_id', candidate_id)
      sessionStorage.setItem('candidate_name', name)
      sessionStorage.setItem('phone_hash', formData.phone_hash)
      sessionStorage.setItem('question_index', '0')
      setIsRegistering(false)
      setPhase(PHASES.LOADING_QUESTIONS)
      return
    }

    try {
      const res = await fetch(`${BASE_URL}/candidate/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Registration failed')
      const { candidate_id, name } = await res.json()
      setCandidateId(candidate_id)
      setCandidateName(name)
      setCurrentIndex(0)
      sessionStorage.setItem('candidate_id', candidate_id)
      sessionStorage.setItem('candidate_name', name)
      sessionStorage.setItem('phone_hash', formData.phone_hash)
      sessionStorage.setItem('question_index', '0')
      setIsRegistering(false)
      setPhase(PHASES.LOADING_QUESTIONS)
    } catch (err) {
      setIsRegistering(false)
      toast.error('Registration failed. Please try again.')
    }
  }

  const handleRestart = () => {
    // Preserve submitted_candidates so duplicate guard persists
    sessionStorage.removeItem('candidate_id')
    sessionStorage.removeItem('candidate_name')
    sessionStorage.removeItem('phone_hash')
    sessionStorage.removeItem('language')
    sessionStorage.removeItem('question_index')
    window.location.reload() // Force clean reset of all states and media streams
  }

  const isInterviewPhase = [
    PHASES.SPEAKING, PHASES.RECORDING, PHASES.CHECKING_AUDIO,
    PHASES.SUBMITTING, PHASES.INTEGRITY_WARNING, PHASES.RESULT,
    PHASES.SUBMIT_ERROR, PHASES.SILENT_AUDIO,
  ].includes(phase)

  return (
    <div className="relative max-w-sm mx-auto min-h-screen bg-surface flex flex-col overflow-hidden">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15), transparent 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.1), transparent 70%)',
        }}
      />

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1a25',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />

      {phase === PHASES.LANGUAGE_SELECT && (
        <LanguageSelect onSelect={handleLanguageSelect} />
      )}

      {(phase === PHASES.REGISTRATION || phase === PHASES.REGISTERING) && (
        <Registration
          language={language}
          onRegister={handleRegister}
          onBack={() => setPhase(PHASES.LANGUAGE_SELECT)}
          isRegistering={isRegistering}
        />
      )}

      {phase === PHASES.LOADING_QUESTIONS && <LoadingQuestions />}

      {phase === PHASES.LOADING_ERROR && (
        <LoadingError onRetry={() => setPhase(PHASES.LOADING_QUESTIONS)} />
      )}

      {phase === PHASES.COMPLETE && (
        <CompleteScreen candidateId={candidateId} onRestart={handleRestart} />
      )}

      {phase === PHASES.TERMINATED && (
        <TerminatedScreen candidateId={candidateId} onRestart={handleRestart} />
      )}

      {isInterviewPhase && questions.length > 0 && (
        <InterviewScreen
          phase={phase}
          setPhase={setPhase}
          questions={questions}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          candidateId={candidateId}
          language={language}
        />
      )}
    </div>
  )
}
