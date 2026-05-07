// SkillSetu — Phase constants
export const PHASES = {
  LANGUAGE_SELECT: 'LANGUAGE_SELECT',
  REGISTRATION: 'REGISTRATION',
  REGISTERING: 'REGISTERING',
  LOADING_QUESTIONS: 'LOADING_QUESTIONS',
  LOADING_ERROR: 'LOADING_ERROR',
  SPEAKING: 'SPEAKING',
  RECORDING: 'RECORDING',
  CHECKING_AUDIO: 'CHECKING_AUDIO',
  SUBMITTING: 'SUBMITTING',
  INTEGRITY_WARNING: 'INTEGRITY_WARNING',
  RESULT: 'RESULT',
  SUBMIT_ERROR: 'SUBMIT_ERROR',
  SILENT_AUDIO: 'SILENT_AUDIO',
  COMPLETE: 'COMPLETE',
  TERMINATED: 'TERMINATED',
}

export const LANG_MAP = { kn: 'kn-IN', hi: 'hi-IN', en: 'en-US' }

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Mock registration response (POST /candidate/register)
export const mockRegisterResponse = {
  candidate_id: 'mock-uuid-abc123',
  name: 'Ravi Kumar',
}

// Mock questions — flat array matching GET /questions?language=kn response shape
export const mockQuestions = {
  kn: [
    { question_id: 1, text: 'ನಿಮ್ಮ ಕೆಲಸದ ಅನುಭವ ಏನು?' },
    { question_id: 2, text: 'ನೀವು ಯಾವ ಉಪಕರಣಗಳನ್ನು ಬಳಸುತ್ತೀರಿ?' },
    { question_id: 3, text: 'ಸುರಕ್ಷತೆ ಬಗ್ಗೆ ನಿಮಗೆ ಏನು ಗೊತ್ತು?' },
  ],
  hi: [
    { question_id: 1, text: 'आपका काम का अनुभव क्या है?' },
    { question_id: 2, text: 'आप कौन से उपकरण उपयोग करते हैं?' },
    { question_id: 3, text: 'सुरक्षा के बारे में आप क्या जानते हैं?' },
  ],
  en: [
    { question_id: 1, text: 'What is your work experience?' },
    { question_id: 2, text: 'What tools do you use?' },
    { question_id: 3, text: 'What do you know about safety?' },
  ],
}

// Trade options for registration form
export const TRADE_OPTIONS = [
  'Electrician',
  'Plumber',
  'Welder',
  'Mason',
  'Carpenter',
  'Painter',
  'Fitter',
  'Turner',
  'Machinist',
  'Other',
]

// District options (Karnataka focus + general)
export const DISTRICT_OPTIONS = [
  'Bengaluru',
  'Mysuru',
  'Hubballi-Dharwad',
  'Mangaluru',
  'Belagavi',
  'Kalaburagi',
  'Davangere',
  'Ballari',
  'Tumakuru',
  'Shivamogga',
  'Other',
]

export const mockSubmitResponse = {
  integrity_flag: false,
  integrity_details: {
    frame_1: true,
    frame_2: true,
    frame_3: true,
    failure_reason: null,
  },
  transcript: 'Sample transcript of candidate response.',
  relevance_score: 7.5,
  completeness_score: 6.8,
  clarity_score: 7.2,
  final_score: 7.2,
  category: 'Job Ready',
}

export const mockIntegrityFailResponse = {
  integrity_flag: true,
  integrity_details: {
    frame_1: true,
    frame_2: false,
    frame_3: false,
    failure_reason: 'multiple_faces',
  },
  transcript: '',
  relevance_score: 0,
  completeness_score: 0,
  clarity_score: 0,
  final_score: 0,
  category: '',
}

export const CATEGORY_STYLES = {
  'Job Ready': 'bg-green-100 text-green-800',
  'Needs Training': 'bg-yellow-100 text-yellow-800',
  'Needs Verification': 'bg-orange-100 text-orange-800',
  'Low Quality': 'bg-red-100 text-red-800',
  'Suspected Fraud': 'bg-red-200 text-red-900',
}
