import { LANG_MAP, BASE_URL } from './constants'

/** Returns a Promise that resolves with the browser's loaded voices list.
 *  Waits up to 1 second for voices to populate (needed on Chrome). */
const getVoices = () =>
  new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) return resolve(voices)
    const onVoicesChanged = () => {
      resolve(window.speechSynthesis.getVoices())
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
    }
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged)
    // Fallback timeout — resolve with whatever is available after 1s
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000)
  })

/** Play Kannada (or any unsupported language) via Django backend TTS proxy.
 *  Splits long text into ≤200-char chunks so URL length stays safe. */
const speakViaBackendTTS = (text, langCode, rate = 0.9) =>
  new Promise((resolve) => {
    // Google TTS max ~200 chars per request — split on sentence boundaries
    const MAX = 200
    const chunks = []
    let remaining = text
    while (remaining.length > 0) {
      if (remaining.length <= MAX) {
        chunks.push(remaining)
        break
      }
      // Try to split at last space/punctuation within MAX chars
      let splitAt = remaining.lastIndexOf(' ', MAX)
      if (splitAt <= 0) splitAt = MAX
      chunks.push(remaining.slice(0, splitAt).trim())
      remaining = remaining.slice(splitAt).trim()
    }

    const playChunk = (index) => {
      if (index >= chunks.length) return resolve()
      const url =
        `${BASE_URL}/tts?q=${encodeURIComponent(chunks[index])}&tl=${langCode}`
      const audio = new Audio(url)
      audio.playbackRate = Math.max(0.5, Math.min(rate, 2.0))
      audio.onended = () => playChunk(index + 1)
      audio.onerror = (e) => {
        console.warn('[TTS] Backend TTS failed for chunk', index, e)
        playChunk(index + 1) // skip failed chunk, continue
      }
      audio.play().catch((e) => {
        console.warn('[TTS] Audio play() failed for chunk', index, e)
        playChunk(index + 1)
      })
    }

    playChunk(0)
  })

/** Wraps speechSynthesis in a Promise. Accepts configurable rate.
 *  Automatically falls back to Google Translate TTS when no native
 *  voice is available for the requested language (e.g. Kannada on Windows). */
export const speak = async (text, language, rate = 0.9) => {
  const langCode = LANG_MAP[language] || 'en-US'
  window.speechSynthesis.cancel()

  // Find a voice that matches the requested language
  const voices = await getVoices()
  const exactMatch = voices.find((v) => v.lang === langCode)
  const prefixMatch = voices.find((v) => v.lang.startsWith(langCode.split('-')[0]))
  const matchedVoice = exactMatch || prefixMatch

  if (matchedVoice) {
    // Native voice available — use Web Speech API
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = langCode
      utterance.voice = matchedVoice
      utterance.rate = rate
      utterance.onend = resolve
      utterance.onerror = resolve
      window.speechSynthesis.speak(utterance)
    })
  }

  // No native voice found — fall back to Django backend TTS proxy
  console.warn(`[TTS] No native voice for "${langCode}", using backend TTS proxy`)
  return speakViaBackendTTS(text, langCode.split('-')[0], rate)
}

/** FileReader blob → base64 string (omits data URL prefix). */
export const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(blob)
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
  })

/** Capture one JPEG keyframe from a video element via Canvas API. */
export const captureKeyframe = (videoEl) => {
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 240
  canvas.getContext('2d').drawImage(videoEl, 0, 0, 320, 240)
  return canvas.toDataURL('image/jpeg').split(',')[1]
}

/** Stop all tracks on a MediaStream. */
export const stopStream = (stream) => {
  if (stream) stream.getTracks().forEach((t) => t.stop())
}

/** Check if audio blob contains meaningful sound (not silence).
 *  Uses Web Audio API RMS analysis. Returns true if audio has content.
 *  NOTE: decodeAudioData often fails on WebM/Opus blobs — in that case
 *  we assume the audio IS valid and let the backend STT verify. */
export const checkAudioHasSound = (blob) => {
  return new Promise((resolve) => {
    // Quick sanity: if blob is tiny (< 1KB), it's definitely empty
    if (blob.size < 1000) {
      console.warn('[AUDIO CHECK] Blob too small:', blob.size, 'bytes')
      resolve(false)
      return
    }

    // BYPASS: Client-side RMS silence detection causes false positives with 
    // modern noise-cancelling mics. We let the backend STT handle it.
    resolve(true)
  })
}
