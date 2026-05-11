'use client'

import { useState } from 'react'
import { setStoredEmail } from '@/lib/localStorage'
import { parseNameFromEmail } from '@/lib/utils'

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_DOMAIN!

type Props = {
  onComplete: (name: string) => void
  message?: string
}

export default function NamePrompt({ onComplete, message }: Props) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) { setError('Please enter your email'); return }
    if (!trimmed.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setError(`Please use your @${ALLOWED_DOMAIN} email`)
      return
    }
    setStoredEmail(trimmed)
    onComplete(parseNameFromEmail(trimmed))
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-4xl mb-4 text-center">👋</div>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Welcome!</h2>
        <p className="text-gray-500 text-center mb-6 text-sm">
          {message || 'Enter your ZoomRx email to continue. Your name will be shown automatically.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              placeholder={`you@${ALLOWED_DOMAIN}`}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
            {email && !error && email.endsWith(`@${ALLOWED_DOMAIN}`) && (
              <p className="text-indigo-600 text-xs mt-1">
                You'll appear as <strong>{parseNameFromEmail(email)}</strong>
              </p>
            )}
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}
