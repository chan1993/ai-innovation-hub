import { parseNameFromEmail } from './utils'

const EMAIL_KEY = 'aih_email'

export function getStoredEmail(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(EMAIL_KEY) || ''
}

export function setStoredEmail(email: string) {
  localStorage.setItem(EMAIL_KEY, email)
}

export function getStoredName(): string {
  const email = getStoredEmail()
  return email ? parseNameFromEmail(email) : ''
}
