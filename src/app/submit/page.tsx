'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Tag } from '@/lib/supabase'
import { getStoredEmail, setStoredEmail } from '@/lib/localStorage'
import { parseNameFromEmail } from '@/lib/utils'

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_DOMAIN!

export default function SubmitPage() {
  const router = useRouter()
  const [tags, setTags] = useState<Tag[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const AI_PLATFORMS = ['Galen', 'Claude', 'ChatGPT', 'Gemini', 'Copilot', 'Cursor', 'Perplexity', 'Other']

  const [form, setForm] = useState({
    person_email: '',
    project: '',
    poc_emails: '',
    idea: '',
    status: 'Idea',
    time_to_implement: '',
    selectedTags: [] as string[],
    ai_platforms: [] as string[],
    github: '',
    sharepoint: '',
    implementation_notes: '',
    references: [''],
  })

  useEffect(() => {
    const email = getStoredEmail()
    if (email) setForm((f) => ({ ...f, person_email: email }))
    supabase.from('tags').select('*').order('name').then(({ data }) => {
      if (data) setTags(data)
    })
  }, [])

  function set(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  function toggleTag(id: string) {
    setForm((f) => ({
      ...f,
      selectedTags: f.selectedTags.includes(id)
        ? f.selectedTags.filter((t) => t !== id)
        : [...f.selectedTags, id],
    }))
  }

  function updateRef(i: number, val: string) {
    setForm((f) => {
      const refs = [...f.references]
      refs[i] = val
      return { ...f, references: refs }
    })
  }

  function parsePocEmails(raw: string): string[] {
    return raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.endsWith(`@${ALLOWED_DOMAIN}`))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.person_email.trim()) e.person_email = 'Required'
    else if (!form.person_email.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`))
      e.person_email = `Must be a @${ALLOWED_DOMAIN} email`
    if (!form.project.trim()) e.project = 'Required'
    if (!form.idea.trim()) e.idea = 'Required'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    const email = form.person_email.trim().toLowerCase()
    const person_name = parseNameFromEmail(email)
    const links = {
      github: form.github.trim() || undefined,
      sharepoint: form.sharepoint.trim() || undefined,
      references: form.references.filter((r) => r.trim()),
    }

    const { data: idea, error } = await supabase
      .from('ideas')
      .insert({
        project: form.project.trim() || null,
        idea: form.idea.trim(),
        outcome: form.idea.trim(),
        person_name,
        person_email: email,
        status: form.status,
        time_to_implement: form.time_to_implement || null,
        links,
        poc_emails: parsePocEmails(form.poc_emails),
        ai_platforms: form.ai_platforms,
        implementation_notes: form.implementation_notes.trim() || null,
      })
      .select()
      .single()

    if (error || !idea) {
      setErrors({ submit: 'Something went wrong. Please try again.' })
      setSubmitting(false)
      return
    }

    if (form.selectedTags.length) {
      await supabase.from('idea_tags').insert(
        form.selectedTags.map((tag_id) => ({ idea_id: idea.id, tag_id }))
      )
    }

    setStoredEmail(email)
    router.push(`/idea/${idea.id}`)
  }

  const inputCls = (field: string) =>
    `w-full border rounded-xl px-4 py-3 text-sm text-white bg-white/5 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#4f86f7] focus:border-transparent ${
      errors[field] ? 'border-red-500/50 bg-red-500/10' : 'border-white/10'
    }`

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-[#4f86f7]/20 via-[#0d1430] to-[#0d1430] border border-[#4f86f7]/20 rounded-2xl px-6 py-5 mb-8 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-[#4f86f7]/15 flex items-center justify-center text-2xl shrink-0">💡</div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Submit an Idea</h1>
          <p className="text-white/50 text-sm mt-0.5">Share an AI idea or practical application with the team.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#0d1430] border border-white/10 rounded-2xl overflow-hidden">

        {/* Section 1 — Core idea */}
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-[#4f86f7] uppercase tracking-wider">Core Details</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Work Email <span className="text-red-400">*</span>
            </label>
            <input type="email" value={form.person_email}
              onChange={(e) => set('person_email', e.target.value)}
              placeholder={`you@${ALLOWED_DOMAIN}`}
              className={inputCls('person_email')} />
            {form.person_email && !errors.person_email && (
              <p className="text-[#4f86f7] text-xs mt-1">
                Posting as <strong>{parseNameFromEmail(form.person_email)}</strong>
              </p>
            )}
            {errors.person_email && <p className="text-red-400 text-xs mt-1">{errors.person_email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Idea Title <span className="text-red-400">*</span>
            </label>
            <input type="text" value={form.project} onChange={(e) => set('project', e.target.value)}
              placeholder="e.g. AI Transcript Summariser, Auto-Slide Generator"
              className={inputCls('project')} />
            {errors.project && <p className="text-red-400 text-xs mt-1">{errors.project}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Points of Contact <span className="text-white/30 font-normal text-xs">(optional)</span>
            </label>
            <input
              type="text"
              value={form.poc_emails}
              onChange={(e) => set('poc_emails', e.target.value)}
              placeholder={`e.g. john.doe@${ALLOWED_DOMAIN}, jane.smith@${ALLOWED_DOMAIN}`}
              className={inputCls('poc_emails')}
            />
            {form.poc_emails.trim() && (() => {
              const names = form.poc_emails
                .split(',')
                .map((e) => e.trim().toLowerCase())
                .filter((e) => e.endsWith(`@${ALLOWED_DOMAIN}`))
                .map((e) => parseNameFromEmail(e))
              return names.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {names.map((name, i) => (
                    <span key={i} className="flex items-center gap-1 bg-[#4f86f7]/10 text-[#4f86f7] text-xs px-2.5 py-1 rounded-full border border-[#4f86f7]/20">
                      <span className="w-4 h-4 rounded-full bg-[#4f86f7] flex items-center justify-center text-white font-bold text-[9px]">
                        {name.charAt(0)}
                      </span>
                      {name}
                    </span>
                  ))}
                </div>
              ) : null
            })()}
            <p className="text-white/25 text-xs mt-1">Separate multiple emails with commas</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Idea Description & Expected Leverage <span className="text-red-400">*</span>
            </label>
            <textarea rows={6} value={form.idea} onChange={(e) => set('idea', e.target.value)}
              placeholder="Describe the AI idea and the expected benefit or improvement it will bring to the team..."
              className={inputCls('idea')} />
            {errors.idea && <p className="text-red-400 text-xs mt-1">{errors.idea}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Stage</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)}
                className={inputCls('status')}>
                <option value="Idea" className="bg-[#0d1430] text-white">💡 Idea</option>
                <option value="In Progress" className="bg-[#0d1430] text-white">🔄 In Progress</option>
                <option value="Implemented" className="bg-[#0d1430] text-white">✅ Implemented</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Time to Implement <span className="text-white/30 font-normal text-xs">(optional)</span>
              </label>
              <select value={form.time_to_implement} onChange={(e) => set('time_to_implement', e.target.value)}
                className={inputCls('time_to_implement')}>
                <option value="" className="bg-[#0d1430] text-white">Not sure</option>
                <option value="< 5 mins" className="bg-[#0d1430] text-white">Less than 5 minutes</option>
                <option value="5–15 mins" className="bg-[#0d1430] text-white">5 to 15 minutes</option>
                <option value="15–30 mins" className="bg-[#0d1430] text-white">15 to 30 minutes</option>
                <option value="< 1 hour" className="bg-[#0d1430] text-white">Less than 1 hour</option>
                <option value="1–2 hours" className="bg-[#0d1430] text-white">1 to 2 hours</option>
                <option value="2+ hours" className="bg-[#0d1430] text-white">More than 2 hours</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Tags</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {tags.map((tag) => (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.selectedTags.includes(tag.id)
                        ? 'bg-[#4f86f7] text-white border-[#4f86f7]'
                        : 'bg-white/5 text-white/50 border-white/10 hover:border-[#4f86f7]/50'
                    }`}>
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 — Links & Resources */}
        <div className="border-t border-white/10 bg-white/3 p-8 space-y-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Links & Resources</span>
            <span className="text-xs text-white/25">(all optional)</span>
          </div>

          {/* AI Platforms */}
          <div>
            <label className="block text-sm font-semibold text-white/70 mb-2">AI Platform(s) Used</label>
            <div className="flex flex-wrap gap-2">
              {AI_PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setForm((f) => ({
                    ...f,
                    ai_platforms: f.ai_platforms.includes(platform)
                      ? f.ai_platforms.filter((p) => p !== platform)
                      : [...f.ai_platforms, platform],
                  }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.ai_platforms.includes(platform)
                      ? 'bg-[#4f86f7] text-white border-[#4f86f7]'
                      : 'bg-white/5 text-white/50 border-white/10 hover:border-[#4f86f7]/50'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* GitHub */}
          <div>
            <label className="block text-sm font-semibold text-white/70 mb-1">GitHub / Gist</label>
            <input type="url" value={form.github} onChange={(e) => set('github', e.target.value)}
              placeholder="https://github.com/..."
              className={inputCls('github')} />
          </div>

          {/* SharePoint + Instructions */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-white/70 mb-1">SharePoint Link</label>
              <div className="bg-[#4f86f7]/8 border border-[#4f86f7]/20 rounded-xl px-4 py-3 mb-2">
                <p className="text-xs text-[#4f86f7]/80 leading-relaxed">
                  📁 Upload all files to a shared SharePoint folder and set access to <strong>"Everyone at ZoomRx"</strong> — this ensures anyone can open your files without needing to request access.
                </p>
              </div>
              <input type="url" value={form.sharepoint} onChange={(e) => set('sharepoint', e.target.value)}
                placeholder="https://zoomrx.sharepoint.com/..."
                className={inputCls('sharepoint')} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/70 mb-1">Implementation Instructions</label>
              <p className="text-xs text-white/25 mb-2">Step-by-step instructions to replicate this idea. Write them here or paste from your SharePoint doc.</p>
              <textarea
                rows={5}
                value={form.implementation_notes}
                onChange={(e) => set('implementation_notes', e.target.value)}
                placeholder={`e.g.\n1. Go to ChatGPT and open a new conversation\n2. Upload the transcript file\n3. Use the following prompt: "Summarise this into key themes..."\n4. Copy the output into the report template on SharePoint`}
                className={inputCls('implementation_notes')}
              />
            </div>
          </div>

          {/* References */}
          <div>
            <label className="block text-sm font-semibold text-white/70 mb-1">Reference Links</label>
            <p className="text-xs text-white/30 mb-2">Papers, articles, tools</p>
            <div className="space-y-2">
              {form.references.map((ref, i) => (
                <div key={i} className="flex gap-2">
                  <input type="url" value={ref} onChange={(e) => updateRef(i, e.target.value)}
                    placeholder="https://..."
                    className="flex-1 border border-white/10 rounded-xl px-4 py-3 text-sm text-white bg-white/5 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#4f86f7]" />
                  {i > 0 && (
                    <button type="button"
                      onClick={() => setForm((f) => ({ ...f, references: f.references.filter((_, idx) => idx !== i) }))}
                      className="text-red-400 hover:text-red-300 px-2">✕</button>
                  )}
                </div>
              ))}
              <button type="button"
                onClick={() => setForm((f) => ({ ...f, references: [...f.references, ''] }))}
                className="text-[#4f86f7] hover:text-[#3b72e0] text-xs font-medium">
                + Add another reference
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-8 py-5 bg-[#0d1430]">
          {errors.submit && <p className="text-red-400 text-sm text-center mb-4">{errors.submit}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()}
              className="flex-1 border border-white/10 text-white/60 py-3 rounded-xl font-medium text-sm hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 bg-[#4f86f7] hover:bg-[#3b72e0] disabled:opacity-50 text-white py-3 rounded-xl font-medium text-sm transition-colors shadow-sm shadow-[#4f86f7]/30">
              {submitting ? 'Submitting...' : 'Submit Idea'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
