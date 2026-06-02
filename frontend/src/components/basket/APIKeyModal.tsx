'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, ShieldCheck, HelpCircle, X } from 'lucide-react'

interface APIKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (provider: 'gemini' | 'groq', model: string, apiKey: string) => void
  initialProvider?: 'gemini' | 'groq'
  initialModel?: string
  initialApiKey?: string
}

const PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    helpUrl: 'https://aistudio.google.com/',
    models: [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ],
    defaultModel: 'gemini-2.5-flash',
  },
  groq: {
    name: 'Groq Cloud',
    helpUrl: 'https://console.groq.com/',
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'gemma3-27b-it',
      'gemma3-12b-it',
      'gemma3-4b-it',
      'gemma2-9b-it',
      'mixtral-8x7b-32768'
    ],
    defaultModel: 'llama-3.3-70b-versatile',
  },
} as const

export function APIKeyModal({
  isOpen,
  onClose,
  onSave,
  initialProvider = 'gemini',
  initialModel,
  initialApiKey = '',
}: APIKeyModalProps) {
  const [provider, setProvider] = useState<'gemini' | 'groq'>(initialProvider)
  const [model, setModel] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>(initialApiKey)
  const [showKey, setShowKey] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Update selection when initial values change or modal opens
  useEffect(() => {
    if (isOpen) {
      setProvider(initialProvider)
      setApiKey(initialApiKey)
      setModel(initialModel || PROVIDERS[initialProvider].defaultModel)
      setError(null)
    }
  }, [isOpen, initialProvider, initialModel, initialApiKey])

  // Update default model when provider changes
  const handleProviderChange = (prov: 'gemini' | 'groq') => {
    setProvider(prov)
    setModel(PROVIDERS[prov].defaultModel)
    
    // Load previously stored key for this provider if it exists
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem(`shopsmart_${prov}_api_key`) || ''
      setApiKey(storedKey)
    }
    setError(null)
  }

  if (!isOpen) return null

  const handleRevoke = () => {
    setApiKey('')
    setError(null)
    onSave(provider, model, '')
  }

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('API Key is required to connect to the optimizer.')
      return
    }
    setError(null)
    onSave(provider, model, apiKey.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Translucent Backdrop blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container (Radius large: 24px and dark surface color #0e1322) */}
      <div 
        className="relative bg-[#0e1322] border border-white/10 w-full max-w-md rounded-[24px] p-6 md:p-8 shadow-2xl shadow-black/80 z-10 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header Row */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="text-[#22c55e] w-5 h-5 shrink-0" />
            <h2 id="modal-title" className="text-[#dee1f7] text-base font-bold tracking-tight">
              API Connection Setup
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-[#bccbb9]/60 hover:text-white transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex flex-col gap-5">
          {/* Provider Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#bccbb9]/60">
              Select Provider
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(PROVIDERS) as Array<'gemini' | 'groq'>).map((provKey) => {
                const isSelected = provider === provKey
                return (
                  <button
                    key={provKey}
                    type="button"
                    onClick={() => handleProviderChange(provKey)}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all duration-200 flex flex-col items-center gap-1 cursor-pointer
                      ${
                        isSelected
                          ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30 shadow-lg shadow-[#22c55e]/5'
                          : 'bg-white/5 text-[#bccbb9]/60 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <span>{PROVIDERS[provKey].name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Model Selection */}
          <div className="flex flex-col gap-2">
            <label htmlFor="model-select" className="text-[10px] font-bold uppercase tracking-wider text-[#bccbb9]/60">
              Select Model
            </label>
            <div className="relative w-full">
              <select
                id="model-select"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/15 focus:border-[#22c55e]/45 focus:bg-[#090e1c] text-[#dee1f7] text-xs font-semibold rounded-xl px-4 py-3 outline-none cursor-pointer appearance-none transition-all duration-300 shadow-md"
              >
                {PROVIDERS[provider].models.map((mOpt) => (
                  <option key={mOpt} value={mOpt} className="bg-[#0e1322] text-[#dee1f7]">
                    {mOpt}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none select-none">
                <svg
                  className="w-4 h-4 text-[#8e9099] opacity-70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* API Key Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="api-key" className="text-[10px] font-bold uppercase tracking-wider text-[#bccbb9]/60">
                API Key
              </label>
              <a
                href={PROVIDERS[provider].helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[#60a5fa] hover:underline flex items-center gap-1 font-semibold"
              >
                <HelpCircle size={11} />
                <span>Get {provider === 'gemini' ? 'Gemini' : 'Groq'} Key</span>
              </a>
            </div>
            
            <div className="relative w-full">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  setError(null)
                }}
                placeholder={`Enter your ${PROVIDERS[provider].name} API key...`}
                className="w-full bg-[#090e1c]/50 border border-white/10 rounded-xl pl-4 pr-11 py-3 text-xs font-mono text-[#22c55e] focus:ring-1 focus:ring-[#22c55e] focus:border-[#22c55e] outline-none transition-all placeholder:text-[#8e9099]/30"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-4 flex items-center text-[#bccbb9]/60 hover:text-white cursor-pointer select-none"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Helper notice and explicit revoke connection button */}
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px]" style={{ color: '#8e9099' }}>
                Stored locally on your device.
              </span>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleRevoke}
                  className="text-[10px] text-red-400 hover:text-red-300 hover:underline font-bold transition-all cursor-pointer"
                >
                  Revoke Connection
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-[11px] text-red-400 bg-red-950/20 border border-red-900/30 p-3 rounded-lg leading-relaxed select-none animate-in fade-in slide-in-from-top-1 duration-200">
              {error}
            </div>
          )}
        </div>

        {/* Action Button Row */}
        <div className="border-t border-white/5 pt-4 flex gap-3">
          <button
            onClick={onClose}
            type="button"
            className="flex-1 py-3 px-4 border border-white/10 rounded-xl text-xs font-bold text-[#bccbb9] hover:bg-white/5 hover:text-white transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            type="button"
            className="shimmer flex-1 py-3 px-4 bg-[#22c55e] text-[#0e1322] rounded-xl text-xs font-bold shadow-lg shadow-[#22c55e]/20 active:scale-95 transition-all cursor-pointer"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  )
}
