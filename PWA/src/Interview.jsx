import React, { useEffect, useRef, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  Mic, MicOff, AlertTriangle, AlertCircle, CheckCircle, Loader2,
  Volume2, RotateCcw, Sparkles,
} from 'lucide-react'
import { PHASES, BASE_URL, mockSubmitResponse, mockIntegrityFailResponse } from './constants'
import { speak, blobToBase64, captureKeyframe, stopStream, checkAudioHasSound } from './utils'
import { WavePath } from '@/components/ui/wave-path'

const DEV_MODE = false // ← Toggle to false when real backend is connected
const MALPRACTICE_THRESHOLD = 3 // Terminate interview after this many integrity failures

// ─── Progress Bar ────────────────────────────────────────────────────────────
function ProgressBar({ current, total, candidateId }) {
  const pct = ((current + 1) / total) * 100
  return (
    <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-white/50">
          Question {current + 1} of {total}
        </span>
        <span className="text-xs text-white/25 font-mono">ID: {candidateId}</span>
      </div>
      <div className="w-full bg-white/[0.06] rounded-full h-1.5">
        <div
          className="bg-gradient-to-r from-accent to-purple-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Loading / Error ──────────────────────────────────────────────────────────
export function LoadingQuestions() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6">
      <div className="space-y-3 p-6 w-full">
        <div className="h-4 rounded w-3/4 animate-shimmer-dark" />
        <div className="h-4 rounded w-1/2 animate-shimmer-dark" style={{ animationDelay: '0.2s' }} />
        <div className="h-4 rounded w-full animate-shimmer-dark" style={{ animationDelay: '0.4s' }} />
      </div>
      <p className="text-sm text-white/30 mt-2">Loading questions…</p>
    </div>
  )
}

export function LoadingError({ onRetry }) {
  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6 gap-4">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center glow-red">
        <AlertCircle size={32} className="text-red-400" />
      </div>
      <p className="text-center text-white/70 font-medium">
        Failed to load questions. Please check your connection.
      </p>
      <button
        onClick={onRetry}
        className="px-8 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold hover:bg-red-500/30 active:scale-95 transition-all"
      >
        Retry
      </button>
    </div>
  )
}

// ─── Complete Screen ──────────────────────────────────────────────────────────
export function CompleteScreen({ candidateId, onRestart }) {
  useEffect(() => {
    const phoneHash = sessionStorage.getItem('phone_hash')
    if (!phoneHash) return
    const previousCandidates = JSON.parse(
      sessionStorage.getItem('submitted_candidates') || '[]'
    )
    if (!previousCandidates.includes(phoneHash)) {
      previousCandidates.push(phoneHash)
      sessionStorage.setItem(
        'submitted_candidates',
        JSON.stringify(previousCandidates)
      )
    }
  }, [candidateId])

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6 gap-6 text-center relative z-10">
      <div className="animate-float">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center glow-green">
          <CheckCircle size={40} className="text-green-400" />
        </div>
      </div>
      <div className="animate-fade-in-up">
        <h2 className="text-2xl font-extrabold text-white">Interview Complete!</h2>
        <p className="mt-2 text-white/40 text-sm">
          Thank you for your time. Your responses have been recorded.
        </p>
        <p className="mt-3 text-xs text-white/25">Candidate ID: <span className="font-bold text-white/50">{candidateId}</span></p>
      </div>
      <WavePath className="w-full my-4" />
      <button
        onClick={onRestart}
        className="btn-primary"
      >
        Start New Interview
      </button>
    </div>
  )
}

// ─── Result Card (scores hidden from candidate — admin dashboard only) ───────
function ResultCard({ onNext, hasMore }) {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto">
      <div className="flex flex-col items-center justify-center p-8 text-center glass-card glow-green">
        <CheckCircle className="text-green-400 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-white mb-2">Answer Recorded</h2>
        <p className="text-white/40 text-base">
          Your response has been saved successfully.
        </p>
      </div>

      <button
        id="next-question-btn"
        onClick={onNext}
        className="btn-primary"
      >
        {hasMore ? 'Next Question →' : 'Finish Interview'}
      </button>
    </div>
  )
}

// ─── Main Interview Screen ────────────────────────────────────────────────────
export function InterviewScreen({
  phase, setPhase,
  questions, currentIndex, setCurrentIndex,
  candidateId, language,
}) {
  const question = questions[currentIndex]
  const total = questions.length
  const hasMore = currentIndex + 1 < total

  // Refs for stream cleanup
  const audioStreamRef = useRef(null)
  const videoStreamRef = useRef(null)
  const videoElRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const mimeTypeRef = useRef('audio/webm')
  const timerRef = useRef(null)
  const speakingRef = useRef(false)

  // Multi-keyframe capture refs
  const keyframesRef = useRef([])
  const keyframeCaptureRef = useRef(null)
  const recordingStartTimeRef = useRef(null)
  // Always-current question ref — avoids stale closures in useCallback([], [])
  const questionRef = useRef(question)
  questionRef.current = question  // sync on every render

  const [timer, setTimer] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [result, setResult] = useState(null)

  // Malpractice tracking — accumulates across entire interview
  const [malpracticeCount, setMalpracticeCount] = useState(0)
  const [integrityDetails, setIntegrityDetails] = useState(null)

  // TTS speed control — 3 levels
  const SPEED_LEVELS = [
    { label: 'Slow', rate: 0.6, icon: '🐢' },
    { label: 'Normal', rate: 0.9, icon: '🔊' },
    { label: 'Fast', rate: 1.2, icon: '⚡' },
  ]
  const [speedIndex, setSpeedIndex] = useState(1) // default: Normal (0.9)
  const [isReplaying, setIsReplaying] = useState(false)

  // cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
      stopStream(audioStreamRef.current)
      stopStream(videoStreamRef.current)
      clearInterval(timerRef.current)
      clearInterval(keyframeCaptureRef.current)
    }
  }, [])

  // Chrome TTS keep-alive
  useEffect(() => {
    const interval = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  // Run TTS when SPEAKING phase activates
  useEffect(() => {
    if (phase !== PHASES.SPEAKING) return
    speakingRef.current = true
    let cancelled = false;
    (async () => {
      // Speak question text at the user's selected speed
      if (!cancelled) await speak(question.text, language, SPEED_LEVELS[speedIndex].rate)
      if (!cancelled) setPhase(PHASES.RECORDING)
    })()
    return () => { cancelled = true; speakingRef.current = false }
  }, [phase, currentIndex])

  // Replay question at current speed (available during RECORDING before mic starts)
  const replayQuestion = useCallback(async () => {
    if (isReplaying || isRecording) return
    setIsReplaying(true)
    window.speechSynthesis.cancel()
    await speak(question.text, language, SPEED_LEVELS[speedIndex].rate)
    setIsReplaying(false)
  }, [question, language, speedIndex, isReplaying, isRecording])

  // Multi-keyframe capture — captures 3 frames at 25%, 50%, 75% of estimated recording
  const startKeyframeCapture = useCallback((videoElement, totalDurationEstimate = 15000) => {
    keyframesRef.current = []
    const interval = totalDurationEstimate / 4
    let count = 0
    keyframeCaptureRef.current = setInterval(() => {
      if (count >= 3) {
        clearInterval(keyframeCaptureRef.current)
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 240
      canvas.getContext('2d').drawImage(videoElement, 0, 0, 320, 240)
      keyframesRef.current.push(canvas.toDataURL('image/jpeg').split(',')[1])
      count++
    }, interval)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      audioStreamRef.current = audioStream
      videoStreamRef.current = videoStream

      // Attach video to hidden element for keyframe
      if (!videoElRef.current) {
        videoElRef.current = document.createElement('video')
        videoElRef.current.muted = true
        videoElRef.current.playsInline = true
      }
      videoElRef.current.srcObject = videoStream
      await new Promise((res) => {
        videoElRef.current.onloadedmetadata = () => { videoElRef.current.play(); res() }
      })

      // Start multi-keyframe capture immediately after video is ready
      startKeyframeCapture(videoElRef.current)

      // Explicitly request opus codec — plain 'audio/webm' produces silent files on Chrome/Windows
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4'
      mimeTypeRef.current = mimeType
      console.log('[RECORDER] Using MIME type:', mimeType)
      const recorder = new MediaRecorder(audioStream, { mimeType })
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.start(250)
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setTimer(0)
      recordingStartTimeRef.current = Date.now()
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000)
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        toast.error('Microphone and camera access is required')
      } else if (err.name === 'NotFoundError') {
        toast.error('No microphone or camera found on this device')
      } else {
        toast.error('Could not access media devices')
      }
    }
  }, [])

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current)
    clearInterval(keyframeCaptureRef.current)
    setIsRecording(false)
    const recorder = mediaRecorderRef.current
    if (!recorder) return
    recorder.onstop = async () => {
      try {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })

        // Duration guard — reject recordings under 2 seconds
        const recordingDuration = Date.now() - recordingStartTimeRef.current
        const MIN_DURATION_MS = 2000
        if (!DEV_MODE && recordingDuration < MIN_DURATION_MS) {
          toast.error('Recording too short. Please speak your full answer.')
          stopStream(videoStreamRef.current)
          stopStream(audioStreamRef.current)
          videoStreamRef.current = null
          audioStreamRef.current = null
          setPhase(PHASES.RECORDING)
          return
        }

        // Fill remaining keyframe slots if recording was short
        if (keyframesRef.current.length < 3 && videoElRef.current) {
          const canvas = document.createElement('canvas')
          canvas.width = 320
          canvas.height = 240
          canvas.getContext('2d').drawImage(videoElRef.current, 0, 0, 320, 240)
          const fallback = canvas.toDataURL('image/jpeg').split(',')[1]
          while (keyframesRef.current.length < 3) {
            keyframesRef.current.push(fallback)
          }
        }

        // Silence detection — skip in DEV_MODE
        setPhase(PHASES.CHECKING_AUDIO)
        const hasMeaningfulAudio = DEV_MODE
          ? true
          : await checkAudioHasSound(blob)

        if (!hasMeaningfulAudio) {
          stopStream(videoStreamRef.current)
          stopStream(audioStreamRef.current)
          videoStreamRef.current = null
          audioStreamRef.current = null
          setPhase(PHASES.SILENT_AUDIO)
          return
        }

        // Audio is valid — proceed to submission
        const base64Audio = await blobToBase64(blob)
        stopStream(videoStreamRef.current)
        stopStream(audioStreamRef.current)
        videoStreamRef.current = null
        audioStreamRef.current = null
        setPhase(PHASES.SUBMITTING)
        await submitAnswer(base64Audio, questionRef.current.question_id)
      } catch {
        toast.error('Submission failed. Please try again.')
        setPhase(PHASES.SUBMIT_ERROR)
      }
    }
    recorder.stop()
  }, [])

  const submitAnswer = async (base64Audio, qid) => {
    if (DEV_MODE) {
      await new Promise((r) => setTimeout(r, 2000))
      const res = (qid === 2 || qid === 3)
        ? mockIntegrityFailResponse
        : mockSubmitResponse
      handleResult(res)
      return
    }
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    try {
      const res = await fetch(`${BASE_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          candidate_id: candidateId,
          question_id: qid,
          language,
          audio_base64: base64Audio,
          keyframes: keyframesRef.current,
        }),
      })
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      handleResult(data)
    } catch (err) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        toast.error('Server took too long. Please try again.')
      } else {
        toast.error('Submission failed. Please try again.')
      }
      setPhase(PHASES.SUBMIT_ERROR)
    }
  }

  const handleResult = (data) => {
    if (data.integrity_flag) {
      setIntegrityDetails(data.integrity_details || null)
      const newCount = malpracticeCount + 1
      setMalpracticeCount(newCount)
      if (newCount >= MALPRACTICE_THRESHOLD) {
        setPhase(PHASES.TERMINATED)
      } else {
        setPhase(PHASES.INTEGRITY_WARNING)
      }
    } else {
      if (DEV_MODE) console.log('[DEV] Full submission result:', data)
      toast.success('Answer recorded!', { duration: 2000 })
      setResult(data)
      setPhase(PHASES.RESULT)
    }
  }

  const handleNext = () => {
    if (hasMore) {
      const next = currentIndex + 1
      setCurrentIndex(next)
      sessionStorage.setItem('question_index', String(next))
      setPhase(PHASES.SPEAKING)
    } else {
      setPhase(PHASES.COMPLETE)
    }
  }

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ProgressBar current={currentIndex} total={total} candidateId={candidateId} />

      {/* SPEAKING */}
      {phase === PHASES.SPEAKING && (
        <div className="flex flex-col flex-1 px-5 py-6 gap-5 justify-between">
          <div className="glass-card p-5 flex-1 flex items-center">
            <p className="text-lg font-semibold text-white/90 leading-relaxed">{question.text}</p>
          </div>

          {/* Speed control */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-white/30 mr-1">Speed:</span>
            {SPEED_LEVELS.map((level, i) => (
              <button
                key={level.label}
                onClick={() => setSpeedIndex(i)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  speedIndex === i
                    ? 'bg-accent text-white shadow-md shadow-accent/30 scale-105'
                    : 'bg-white/[0.05] text-white/40 hover:bg-white/[0.1]'
                }`}
              >
                {level.icon} {level.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="relative flex items-center justify-center w-16 h-16">
              <div className="absolute w-16 h-16 rounded-full bg-accent/30 animate-ping" />
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center glow-accent">
                <Volume2 className="text-white" size={24} />
              </div>
            </div>
            <span className="text-sm font-medium text-accent-light">Speaking… ({SPEED_LEVELS[speedIndex].label})</span>
            <button disabled className="mt-1 flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.05] text-white/25 cursor-not-allowed opacity-50 text-sm font-semibold">
              <MicOff size={18} /> Listening…
            </button>
          </div>
        </div>
      )}

      {/* RECORDING */}
      {phase === PHASES.RECORDING && (
        <div className="flex flex-col flex-1 px-5 py-6 gap-4 justify-between">
          <div className="glass-card p-5 flex-1 flex items-center">
            <p className="text-lg font-semibold text-white/90 leading-relaxed">{question.text}</p>
          </div>

          {!isRecording && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-white/30 mr-1">Speed:</span>
                {SPEED_LEVELS.map((level, i) => (
                  <button
                    key={level.label}
                    onClick={() => setSpeedIndex(i)}
                    disabled={isReplaying}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      speedIndex === i
                        ? 'bg-accent text-white shadow-md shadow-accent/30 scale-105'
                        : 'bg-white/[0.05] text-white/40 hover:bg-white/[0.1]'
                    } disabled:opacity-50`}
                  >
                    {level.icon} {level.label}
                  </button>
                ))}
              </div>
              <button
                id="replay-question-btn"
                onClick={replayQuestion}
                disabled={isReplaying}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  isReplaying
                    ? 'bg-accent/10 text-accent/50 cursor-not-allowed'
                    : 'bg-accent/10 border border-accent/20 text-accent-light hover:bg-accent/20 active:scale-95'
                }`}
              >
                {isReplaying ? (
                  <><Loader2 size={16} className="animate-spin" /> Replaying…</>
                ) : (
                  <><RotateCcw size={16} /> Replay Question</>
                )}
              </button>
            </div>
          )}

          {!isRecording ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-white/30 text-center">Tap the button below to record your answer</p>
              <button
                id="start-recording-btn"
                onClick={startRecording}
                disabled={isReplaying}
                className="flex items-center gap-3 px-8 py-4 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 font-bold text-base glow-green hover:bg-green-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mic size={22} /> Start Recording
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-semibold text-red-400">Recording…</span>
                <span className="ml-2 text-sm font-mono text-white/50">{fmt(timer)}</span>
              </div>
              <div className="flex gap-4 text-white/30">
                <Mic size={20} className="text-red-400" />
                <span className="text-xs self-center">Mic active</span>
              </div>
              <button
                id="stop-recording-btn"
                onClick={stopRecording}
                className="flex items-center gap-3 px-8 py-4 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-base glow-red hover:bg-red-500/30 active:scale-95 transition-all"
              >
                <MicOff size={22} /> Stop Recording
              </button>
            </div>
          )}
        </div>
      )}

      {/* CHECKING_AUDIO */}
      {phase === PHASES.CHECKING_AUDIO && (
        <div className="flex flex-col flex-1 items-center justify-center gap-4">
          <Loader2 size={40} className="text-accent-light animate-spin" />
          <p className="text-base font-medium text-white/50">Checking audio quality…</p>
        </div>
      )}

      {/* SUBMITTING */}
      {phase === PHASES.SUBMITTING && (
        <div className="flex flex-col flex-1 items-center justify-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 w-12 h-12 rounded-full bg-accent/20 animate-ping" />
            <Loader2 size={48} className="text-accent-light animate-spin relative" />
          </div>
          <p className="text-base font-semibold text-white/60">Analysing your response…</p>
        </div>
      )}

      {/* SILENT_AUDIO */}
      {phase === PHASES.SILENT_AUDIO && (
        <div className="flex flex-col flex-1 items-center justify-center px-5 gap-4">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center glow-orange">
            <MicOff className="text-yellow-400" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">No Audio Detected</h2>
          <p className="text-white/40 text-sm text-center">
            We could not detect any sound in your recording.
          </p>
          <ul className="text-sm text-white/30 text-left space-y-1 w-full">
            <li>• Check your microphone is not muted</li>
            <li>• Speak clearly and close to the device</li>
            <li>• Allow microphone access if prompted again</li>
            <li>• Try removing and reinserting headphones</li>
          </ul>
          <button
            onClick={() => { setIsRecording(false); setPhase(PHASES.RECORDING) }}
            className="w-full py-3 rounded-xl bg-accent/20 border border-accent/30 text-accent-light font-semibold hover:bg-accent/30 active:scale-95 transition-all"
          >
            Try Recording Again
          </button>
        </div>
      )}

      {/* INTEGRITY_WARNING */}
      {phase === PHASES.INTEGRITY_WARNING && (() => {
        const remainingAttempts = MALPRACTICE_THRESHOLD - malpracticeCount
        return (
          <div className="flex flex-col flex-1 items-center justify-center px-5 gap-4">
            <div className="bg-orange-500/[0.06] border border-orange-500/20 rounded-2xl p-6 flex flex-col items-center gap-3 w-full glow-orange">
              <AlertTriangle size={48} className="text-orange-400" />
              <h2 className="text-xl font-bold text-orange-300">Verification Failed</h2>

              {integrityDetails?.failure_reason === 'multiple_faces' && (
                <p className="text-sm text-white/50 text-center">Multiple faces were detected. Please ensure you are alone.</p>
              )}
              {integrityDetails?.failure_reason === 'no_face' && (
                <p className="text-sm text-white/50 text-center">Your face was not clearly visible. Please check your lighting and position.</p>
              )}
              {integrityDetails?.failure_reason === 'duplicate' && (
                <p className="text-sm text-white/50 text-center">Duplicate identity detected. This attempt has been flagged.</p>
              )}
              {integrityDetails?.failure_reason === 'low_quality' && (
                <p className="text-sm text-white/50 text-center">Video quality was too low. Please improve your lighting.</p>
              )}
              {!integrityDetails?.failure_reason && (
                <p className="text-sm text-white/50 text-center">Please ensure your face is clearly visible and you are alone.</p>
              )}

              {/* Frame breakdown */}
              <div className="flex gap-3 my-2">
                {['frame_1', 'frame_2', 'frame_3'].map((frame, i) => (
                  <div key={frame} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      integrityDetails?.[frame] ? 'bg-green-500/30 border border-green-500/50' : 'bg-red-500/30 border border-red-500/50'
                    }`}>
                      {i + 1}
                    </div>
                    <span className="text-xs mt-1 text-white/40">
                      {integrityDetails?.[frame] ? 'OK' : 'Fail'}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-orange-400 font-medium text-center">
                Warning {malpracticeCount} of {MALPRACTICE_THRESHOLD} —{' '}
                {remainingAttempts === 1
                  ? 'One more failure will terminate this interview.'
                  : `${remainingAttempts} more failures will terminate this interview.`}
              </p>

              <button
                id="rerecord-btn"
                onClick={() => { setIsRecording(false); setPhase(PHASES.RECORDING) }}
                className="w-full py-3 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 font-bold hover:bg-orange-500/30 active:scale-95 transition-all"
              >
                Re-record Answer
              </button>
            </div>
          </div>
        )
      })()}

      {/* SUBMIT_ERROR */}
      {phase === PHASES.SUBMIT_ERROR && (
        <div className="flex flex-col flex-1 items-center justify-center px-5 gap-5">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center glow-red">
            <AlertCircle size={32} className="text-red-400" />
          </div>
          <p className="text-center text-white/60 font-medium">
            Something went wrong. Your answer was not submitted.
          </p>
          <button
            id="try-again-btn"
            onClick={() => { setIsRecording(false); setPhase(PHASES.RECORDING) }}
            className="px-8 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold hover:bg-red-500/30 active:scale-95 transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* RESULT */}
      {phase === PHASES.RESULT && result && (
        <ResultCard onNext={handleNext} hasMore={hasMore} />
      )}
    </div>
  )
}

// ─── Terminated Screen ────────────────────────────────────────────────────────
export function TerminatedScreen({ candidateId, onRestart }) {
  useEffect(() => {
    const phoneHash = sessionStorage.getItem('phone_hash')
    if (!phoneHash) return
    const prev = JSON.parse(sessionStorage.getItem('submitted_candidates') || '[]')
    if (!prev.includes(phoneHash)) {
      prev.push(phoneHash)
      sessionStorage.setItem('submitted_candidates', JSON.stringify(prev))
    }
  }, [candidateId])

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-8 text-center relative z-10">
      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 glow-red animate-float">
        <AlertTriangle className="text-red-400" size={40} />
      </div>
      <h2 className="text-2xl font-bold text-red-400 mb-3 animate-fade-in-up">Interview Terminated</h2>
      <p className="text-white/50 mb-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        This interview has been terminated due to repeated integrity violations.
      </p>
      <p className="text-white/30 text-sm mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        Your activity has been flagged and recorded.
        Please contact the assessment center for further assistance.
      </p>
      <div className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-4 w-full mb-8">
        <p className="text-red-400 text-sm font-medium">Candidate ID: {candidateId}</p>
        <p className="text-red-400/50 text-xs mt-1">
          {MALPRACTICE_THRESHOLD} integrity violations recorded
        </p>
      </div>
    </div>
  )
}

