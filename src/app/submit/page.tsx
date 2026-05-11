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

  const [form, setForm] = useState({
    person_email: '',
    project: '',
    idea: '',
    outcome: '',
    status: 'Idea',
    selectedTags: [] as string[],
    github: '',
    demo: '',
    sharepoint: '',
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

  function validate() {
    const e: Record<string, string> = {}
    if (!form.person_email.trim()) e.person_email = 'Required'
    else if (!form.person_email.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`))
      e.person_email = `Must be a @${ALLOWED_DOMAIN} email`
    if (!form.project.trim()) e.project = 'Required'
    if (!form.idea.trim()) e.idea = 'Required'
    if (!form.outcome.trim()) e.outcome = 'Required'
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
      demo: form.demo.trim() || undefined,
      sharepoint: form.sharepoint.trim() || undefined,
      references: form.references.filter((r) => r.trim()),
    }

    const { data: idea, error } = await supabase
      .from('ideas')
      .insert({
        project: form.project.trim(),
        idea: form.idea.trim(),
        outcome: form.outcome.trim(),
        person_name,
        person_email: email,
        status: form.status,
        links,
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
              Project <span className="text-red-400">*</span>
            </label>
            <input type="text" value={form.project} onChange={(e) => set('project', e.target.value)}
              placeholder="e.g. Claims Processing, Patient Outreach"
              className={inputCls('project')} />
            {errors.project && <p className="text-red-400 text-xs mt-1">{errors.project}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              The Idea <span className="text-red-400">*</span>
            </label>
            <textarea rows={4} value={form.idea} onChange={(e) => set('idea', e.target.value)}
              placeholder="Describe the AI idea clearly and concisely..."
              className={inputCls('idea')} />
            {errors.idea && <p className="text-red-400 text-xs mt-1">{errors.idea}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Expected Outcome <span className="text-red-400">*</span>
            </label>
            <textarea rows={3} value={form.outcome} onChange={(e) => set('outcome', e.target.value)}
              placeholder="What result or improvement do you expect?"
              className={inputCls('outcome')} />
            {errors.outcome && <p className="text-red-400 text-xs mt-1">{errors.outcome}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Stage</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)}
                className={inputCls('status')}>
                <option value="Idea">💡 Idea</option>
                <option value="In Progress">🔄 In Progress</option>
                <option value="Implemented">✅ Implemented</option>
              </select>
            </div>
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

        {/* Section 2 — Links */}
        <div className="border-t border-white/10 bg-white/3 p-8 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Links & Resources</span>
            <span className="text-xs text-white/25">(all optional)</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/40 mb-1">GitHub / Gist</label>
            <input type="url" value={form.github} onChange={(e) => set('github', e.target.value)}
              placeholder="https://github.com/..."
              className={inputCls('github')} />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/40 mb-1">Demo — Loom video, hosted app, Colab notebook</label>
            <input type="url" value={form.demo} onChange={(e) => set('demo', e.target.value)}
              placeholder="https://loom.com/..."
              className={inputCls('demo')} />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/40 mb-1">SharePoint</label>
            <input type="url" value={form.sharepoint} onChange={(e) => set('sharepoint', e.target.value)}
              placeholder="https://zoomrx.sharepoint.com/..."
              className={inputCls('sharepoint')} />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/40 mb-1">Reference links — papers, articles, tools</label>
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
