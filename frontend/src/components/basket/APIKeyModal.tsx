'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Key, HelpCircle, X } from 'lucide-react'

interface APIKeyModalProps {
  onClose: () => void
  onSave: (provider: 'gemini', model: string, apiKey: string) => void
  initialProvider?: 'gemini'
  initialModel?: string
  initialApiKey?: string
}

const MODAL_EASE = [0.23, 1, 0.32, 1] as const

const PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    helpUrl: 'https://aistudio.google.com/',
    models: [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemma-4-26b-a4b-it',
      'gemma-4-31b-it',
    ],
    defaultModel: 'gemini-2.5-flash',
  },
} as const

export function APIKeyModal({
  onClose,
  onSave,
  initialProvider = 'gemini',
  initialModel,
  initialApiKey = '',
}: APIKeyModalProps) {
  const [provider] = useState<'gemini'>(initialProvider ?? 'gemini')
  const [model, setModel] = useState<string>(
    initialModel || PROVIDERS[initialProvider ?? 'gemini'].defaultModel
  )
  const [apiKey, setApiKey] = useState<string>(initialApiKey)
  const [showKey, setShowKey] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container (Radius large: 24px and dark surface color #0e1322) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
        transition={{ duration: 0.2, ease: MODAL_EASE }}
        className="relative bg-surface border border-border w-full max-w-sm rounded-[24px] p-6 md:p-8 shadow-2xl shadow-black/80 z-10 flex flex-col gap-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header Row */}
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-2.5">
            <Key className="text-primary w-5 h-5 shrink-0" />
            <div>
              <h2 id="modal-title" className="text-fg text-sm font-bold tracking-tight">
                API Key Setup
              </h2>
              <p className="text-[10px] text-muted/50 font-medium">Configure Google Gemini API key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-muted/60 hover:text-fg transition-colors cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center hover:bg-overlay-sm"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex flex-col gap-5">
          {/* Model Selection */}
          <div className="flex flex-col gap-2">
            <label htmlFor="model-select" className="text-[10px] font-bold uppercase tracking-wider text-muted/60">
              Select Model
            </label>
            <div className="relative w-full">
              <select
                id="model-select"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-surface-dim/50 border border-border hover:border-border/60 focus:border-primary focus:bg-surface-dim focus:ring-2 focus:ring-primary/15 text-fg text-xs font-semibold rounded-xl px-4 py-3 outline-none cursor-pointer appearance-none transition-all duration-300 shadow-md"
              >
                {PROVIDERS[provider].models.map((mOpt) => (
                  <option key={mOpt} value={mOpt} className="bg-surface text-fg">
                    {mOpt}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none select-none">
                <svg
                  className="w-4 h-4 text-subtle opacity-70"
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
              <label htmlFor="api-key" className="text-[10px] font-bold uppercase tracking-wider text-muted/60">
                API Key
              </label>
              <a
                href={PROVIDERS[provider].helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-secondary hover:underline flex items-center gap-1 font-semibold"
              >
                <HelpCircle size={11} />
                <span>Get Gemini Key</span>
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
                placeholder="Enter your Google Gemini API key..."
                className="w-full bg-surface-dim/50 border border-border rounded-xl pl-4 pr-11 py-3 text-xs font-mono text-primary focus:ring-2 focus:ring-primary/15 focus:border-primary outline-none transition-all placeholder:text-subtle/30"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-4 flex items-center text-muted/60 hover:text-fg cursor-pointer select-none"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Helper notice and explicit revoke connection button */}
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] text-subtle">
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
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: MODAL_EASE }}
              className="text-[11px] text-red-400 bg-red-950/20 border border-red-900/30 p-3 rounded-lg leading-relaxed select-none"
            >
              {error}
            </motion.div>
          )}
        </div>

        {/* Action Button Row */}
        <div className="border-t border-border/50 pt-4 flex gap-3">
          <button
            onClick={onClose}
            type="button"
            className="flex-1 py-3 px-4 border border-border rounded-xl text-xs font-bold text-muted hover:bg-overlay-sm hover:text-fg active:scale-95 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            type="button"
            className="shimmer flex-1 py-3 px-4 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all cursor-pointer"
          >
            Save & Continue
          </button>
        </div>
      </motion.div>
    </div>
  )
}
