import React from 'react'
import { ChevronLeft, Loader2, Sparkles } from 'lucide-react'
import { TRADE_OPTIONS, DISTRICT_OPTIONS } from './constants'
import { WavePath } from '@/components/ui/wave-path'

export function LanguageSelect({ onSelect }) {
  const langs = [
    { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳', sub: 'Kannada' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳', sub: 'Hindi' },
    { code: 'en', label: 'English', flag: '🌐', sub: 'English' },
  ]
  return (
    <div className="flex flex-col flex-1 px-6 pt-14 pb-8 relative z-10">
      {/* Logo + Title */}
      <div className="mb-12 text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-purple-500 mb-5 shadow-lg glow-accent">
          <Sparkles className="text-white" size={28} />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Skill<span className="text-gradient">Setu</span>
        </h1>
        <p className="mt-2 text-sm text-white/40 font-medium">
          Select your preferred language
        </p>
      </div>

      {/* WavePath decoration */}
      <div className="flex justify-center mb-8">
        <WavePath className="w-full" />
      </div>

      {/* Language buttons */}
      <div className="flex flex-col gap-3">
        {langs.map(({ code, label, flag, sub }, i) => (
          <button
            key={code}
            id={`lang-${code}`}
            onClick={() => onSelect(code)}
            className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl glass-card-hover group animate-fade-in-up"
            style={{ animationDelay: `${0.1 + i * 0.1}s`, animationFillMode: 'backwards' }}
          >
            <span className="text-3xl">{flag}</span>
            <div className="text-left">
              <div className="text-lg font-bold text-white group-hover:text-accent-light transition-colors">{label}</div>
              <div className="text-xs text-white/30">{sub}</div>
            </div>
            <ChevronLeft className="ml-auto rotate-180 text-white/20 group-hover:text-accent-light transition-colors" size={20} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Registration Form (POST /candidate/register) ────────────────────────────
export function Registration({ language, onRegister, onBack, isRegistering }) {
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [district, setDistrict] = React.useState('')
  const [trade, setTrade] = React.useState('')
  const [errors, setErrors] = React.useState({})

  const validate = () => {
    const e = {}
    if (!name.trim()) e.name = 'Full name is required.'
    if (!phone.trim()) e.phone = 'Phone number is required.'
    else if (!/^\d{10}$/.test(phone.trim())) e.phone = 'Enter a valid 10-digit number.'
    if (!district) e.district = 'Please select a district.'
    if (!trade) e.trade = 'Please select a trade.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate() || isRegistering) return
    onRegister({
      name: name.trim(),
      phone_hash: phone.trim(),
      language,
      district,
      trade,
    })
  }

  const inputClass = (field) =>
    `glass-input ${errors[field] ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400/20' : ''}`

  const selectClass = (field) =>
    `glass-select ${errors[field] ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400/20' : ''}`

  const langLabel = { kn: 'ಕನ್ನಡ', hi: 'हिंदी', en: 'English' }[language] || language

  return (
    <div className="flex flex-col flex-1 px-6 pt-6 pb-6 overflow-y-auto relative z-10 scrollbar-hide">
      <button onClick={onBack} disabled={isRegistering}
        className="flex items-center gap-1 text-accent-light mb-5 w-fit hover:opacity-80 transition-opacity disabled:opacity-30">
        <ChevronLeft size={20} /> <span className="text-sm font-medium">Back</span>
      </button>

      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-2xl font-extrabold text-white">Register</h1>
        <p className="text-sm text-white/40 mt-1.5">
          Fill in your details to begin the interview
        </p>
        <span className="inline-block mt-3 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent-light text-xs font-semibold">
          Language: {langLabel}
        </span>
      </div>

      <div className="flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
        {/* Name */}
        <div>
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Full Name</label>
          <input
            id="reg-name"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })) }}
            placeholder="e.g. Ravi Kumar"
            className={inputClass('name')}
            autoComplete="name"
            autoFocus
            disabled={isRegistering}
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Phone Number</label>
          <input
            id="reg-phone"
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setErrors((p) => ({ ...p, phone: '' })) }}
            placeholder="e.g. 9876543210"
            className={inputClass('phone')}
            inputMode="numeric"
            maxLength={10}
            disabled={isRegistering}
          />
          {errors.phone && <p className="mt-1.5 text-xs text-red-400">{errors.phone}</p>}
        </div>

        {/* District */}
        <div>
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">District</label>
          <select
            id="reg-district"
            value={district}
            onChange={(e) => { setDistrict(e.target.value); setErrors((p) => ({ ...p, district: '' })) }}
            className={selectClass('district')}
            disabled={isRegistering}
          >
            <option value="" className="bg-surface-100 text-white/50">Select district…</option>
            {DISTRICT_OPTIONS.map((d) => <option key={d} value={d} className="bg-surface-100 text-white">{d}</option>)}
          </select>
          {errors.district && <p className="mt-1.5 text-xs text-red-400">{errors.district}</p>}
        </div>

        {/* Trade */}
        <div>
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Trade / Skill</label>
          <select
            id="reg-trade"
            value={trade}
            onChange={(e) => { setTrade(e.target.value); setErrors((p) => ({ ...p, trade: '' })) }}
            className={selectClass('trade')}
            disabled={isRegistering}
          >
            <option value="" className="bg-surface-100 text-white/50">Select trade…</option>
            {TRADE_OPTIONS.map((t) => <option key={t} value={t} className="bg-surface-100 text-white">{t}</option>)}
          </select>
          {errors.trade && <p className="mt-1.5 text-xs text-red-400">{errors.trade}</p>}
        </div>
      </div>

      <button
        id="begin-interview-btn"
        onClick={handleSubmit}
        disabled={isRegistering}
        className={`mt-8 flex items-center justify-center gap-2 ${
          isRegistering
            ? 'btn-primary opacity-60 cursor-not-allowed'
            : 'btn-primary'
        }`}
      >
        {isRegistering ? (
          <><Loader2 size={20} className="animate-spin" /> Registering…</>
        ) : (
          'Begin Interview'
        )}
      </button>
    </div>
  )
}
