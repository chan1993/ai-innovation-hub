'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase, Idea, Tag, IdeaLinks } from '@/lib/supabase'
import LikeButton from '@/components/LikeButton'
import CommentSection from '@/components/CommentSection'
import ImplementationStatus from '@/components/ImplementationStatus'
import { formatDistanceToNow, parseNameFromEmail } from '@/lib/utils'
import { getStoredEmail, setStoredEmail } from '@/lib/localStorage'
import Link from 'next/link'

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_DOMAIN!
const AI_PLATFORMS = ['Galen', 'Claude', 'ChatGPT', 'Gemini', 'Copilot', 'Cursor', 'Perplexity', 'Other']

const statusConfig: Record<string, { label: string; className: string }> = {
  'Idea': { label: '💡 Idea', className: 'bg-blue-500/15 text-blue-300' },
  'In Progress': { label: '🔄 In Progress', className: 'bg-yellow-500/15 text-yellow-300' },
  'Implemented': { label: '✅ Implemented', className: 'bg-green-500/15 text-green-300' },
  'Archived': { label: '📦 Archived', className: 'bg-white/10 text-white/40' },
}

export default function IdeaDetailClient({ id }: { id: string }) {
  const [idea, setIdea] = useState<Idea | null>(null)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  const [verifying, setVerifying] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<{
    project: string; idea: string; team: string
    status: string; time_to_implement: string; selectedTags: string[]
    github: string; sharepoint: string; references: string[]
    poc_emails: string; ai_platforms: string[]; implementation_notes: string
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [similarIdeas, setSimilarIdeas] = useState<{ id: string; idea: string; project: string; s_no: number; person_name: string; status: string; score: number }[]>([])

  // Share
  const [shareOpen, setShareOpen] = useState(false)
  const [toast, setToast] = useState('')
  const shareRef = useRef<HTMLDivElement>(null)

  const STOPWORDS = new Set(['a','an','the','to','and','or','of','in','on','for','with','that','is','are','use','using','into'])

  function tokenize(text: string): Set<string> {
    return new Set(
      text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOPWORDS.has(w))
    )
  }

  function jaccardScore(a: Set<string>, b: Set<string>): number {
    const intersection = [...a].filter((w) => b.has(w)).length
    const union = new Set([...a, ...b]).size
    return union === 0 ? 0 : intersection / union
  }

  useEffect(() => {
    fetchIdea()
    supabase.from('tags').select('*').order('name').then(({ data }) => {
      if (data) setAllTags(data)
    })
  }, [id])

  // Close share dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchIdea() {
    await supabase.rpc('increment_views', { idea_id: id })

    const { data } = await supabase
      .from('ideas')
      .select('*, tags:idea_tags(tag:tags(*)), like_count:likes(count)')
      .eq('id', id)
      .single()

    if (data) {
      const currentIdea = {
        ...data,
        tags: data.tags?.map((t: any) => t.tag).filter(Boolean) ?? [],
        like_count: data.like_count?.[0]?.count ?? 0,
        links: data.links ?? {},
      }
      setIdea(currentIdea)

      const { data: allIdeas } = await supabase
        .from('ideas')
        .select('id, idea, project, s_no, person_name, status')
        .neq('status', 'Archived')
        .neq('id', id)

      if (allIdeas) {
        const currentTokens = tokenize(data.idea)
        const scored = allIdeas
          .map((other: any) => ({ ...other, score: jaccardScore(currentTokens, tokenize(other.idea)) }))
          .filter((o: any) => o.score > 0.1)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 3)
        setSimilarIdeas(scored)
      }
    }
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setShareOpen(false)
    showToast('Link copied!')
  }

  function copyTeamsMessage() {
    if (!idea) return
    const url = window.location.href
    const description = idea.idea?.slice(0, 200) + (idea.idea?.length > 200 ? '...' : '')
    const poc = idea.poc_emails?.length
      ? idea.poc_emails.map(parseNameFromEmail).join(', ')
      : idea.person_name

    const message = `💡 ${idea.project || 'AI Idea'}

${description}

👤 ${poc}

View on ZoomRx AI Innovation Hub: ${url}`

    navigator.clipboard.writeText(message)
    setShareOpen(false)
    showToast('Teams message copied!')
  }

  function startEdit() {
    setEmailInput(getStoredEmail())
    setEmailError('')
    setVerifying(true)
  }

  function confirmEmail() {
    const email = emailInput.trim().toLowerCase()
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setEmailError(`Must be a @${ALLOWED_DOMAIN} email`)
      return
    }
    if (email !== idea?.person_email.toLowerCase()) {
      setEmailError("Email doesn't match the idea's author")
      return
    }
    setStoredEmail(email)
    setVerifying(false)
    const links = idea?.links ?? {}
    setEditForm({
      project: idea?.project ?? '',
      idea: idea?.idea ?? '',
      team: idea?.team ?? '',
      status: idea?.status ?? 'Idea',
      time_to_implement: idea?.time_to_implement ?? '',
      selectedTags: idea?.tags?.map((t) => t.id) ?? [],
      github: links.github ?? '',
      sharepoint: links.sharepoint ?? '',
      references: links.references?.length ? links.references : [''],
      poc_emails: (idea?.poc_emails ?? []).join(', '),
      ai_platforms: idea?.ai_platforms ?? [],
      implementation_notes: idea?.implementation_notes ?? '',
    })
    setIsEditing(true)
  }

  async function handleSave() {
    if (!idea || !editForm) return
    setSaving(true)
    const links: IdeaLinks = {
      github: editForm.github.trim() || undefined,
      sharepoint: editForm.sharepoint.trim() || undefined,
      references: editForm.references.filter((r) => r.trim()),
    }

    const poc_emails = editForm.poc_emails
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.endsWith(`@${ALLOWED_DOMAIN}`))

    await supabase.from('ideas').update({
      project: editForm.project.trim() || null,
      idea: editForm.idea,
      outcome: editForm.idea,
      team: editForm.team || null,
      status: editForm.status,
      time_to_implement: editForm.time_to_implement || null,
      links,
      poc_emails,
      ai_platforms: editForm.ai_platforms,
      implementation_notes: editForm.implementation_notes.trim() || null,
    }).eq('id', idea.id)

    await supabase.from('idea_tags').delete().eq('idea_id', idea.id)
    if (editForm.selectedTags.length) {
      await supabase.from('idea_tags').insert(
        editForm.selectedTags.map((tag_id) => ({ idea_id: idea.id, tag_id }))
      )
    }

    setSaving(false)
    setIsEditing(false)
    setEditForm(null)
    fetchIdea()
  }

  const links = idea?.links ?? {}
  const inputCls = 'w-full border border-white/10 rounded-xl px-4 py-3 text-sm text-white bg-white/5 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#4f86f7]'

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-white/10 rounded w-1/2" />
        <div className="h-4 bg-white/10 rounded w-full" />
        <div className="h-4 bg-white/10 rounded w-4/5" />
      </div>
    )
  }

  if (!idea) {
    return (
      <div className="text-center py-20">
        <p className="text-white/40 text-lg">Idea not found.</p>
        <Link href="/" className="text-[#4f86f7] text-sm mt-2 inline-block">← Back to feed</Link>
      </div>
    )
  }

  const statusInfo = statusConfig[idea.status] ?? statusConfig['Idea']

  return (
    <div className="max-w-3xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a2544] border border-[#4f86f7]/30 text-white text-sm px-5 py-2.5 rounded-xl shadow-xl z-50 transition-all">
          ✅ {toast}
        </div>
      )}

      <Link href="/" className="text-sm text-white/40 hover:text-white flex items-center gap-1 mb-6 transition-colors">
        ← Back to feed
      </Link>

      {/* Email verify modal */}
      {verifying && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1430] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Verify your identity</h3>
            <p className="text-sm text-white/50 mb-4">Enter the email you used to submit this idea.</p>
            <input type="email" value={emailInput}
              onChange={(e) => { setEmailInput(e.target.value); setEmailError('') }}
              placeholder={`you@${ALLOWED_DOMAIN}`}
              className="w-full border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white bg-white/5 placeholder-white/30 mb-2 focus:outline-none focus:ring-2 focus:ring-[#4f86f7]" />
            {emailError && <p className="text-red-400 text-xs mb-3">{emailError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setVerifying(false)}
                className="flex-1 border border-white/10 text-white/60 py-2 rounded-xl text-sm hover:bg-white/5">Cancel</button>
              <button onClick={confirmEmail}
                className="flex-1 bg-[#4f86f7] text-white py-2 rounded-xl text-sm hover:bg-[#3b72e0]">Verify</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#0d1430] border border-white/10 rounded-2xl p-8 mb-6 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4f86f7] to-violet-500" />

        {/* Title */}
        <div className="mb-5">
          {isEditing ? (
            <input
              value={editForm?.project ?? ''}
              onChange={(e) => setEditForm((f) => f ? { ...f, project: e.target.value } : f)}
              placeholder="Idea Title"
              className="w-full text-2xl font-bold text-white bg-transparent border-b border-white/20 pb-1 focus:outline-none focus:border-[#4f86f7] placeholder-white/20"
            />
          ) : (
            <h1 className="text-2xl font-bold text-white leading-snug">{idea.project || 'Untitled Idea'}</h1>
          )}
        </div>

        {/* Badges row */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {isEditing ? (
              <select value={editForm?.status ?? 'Idea'} onChange={(e) => setEditForm((f) => f ? { ...f, status: e.target.value } : f)}
                className="border border-white/10 rounded-lg px-2 py-1 text-xs text-white bg-[#0d1430]">
                <option value="Idea" className="bg-[#0d1430] text-white">💡 Idea</option>
                <option value="In Progress" className="bg-[#0d1430] text-white">🔄 In Progress</option>
                <option value="Implemented" className="bg-[#0d1430] text-white">✅ Implemented</option>
              </select>
            ) : (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.className}`}>{statusInfo.label}</span>
            )}

            {isEditing ? (
              <select value={editForm?.team ?? ''} onChange={(e) => setEditForm((f) => f ? { ...f, team: e.target.value } : f)}
                className="border border-white/10 rounded-lg px-2 py-1 text-xs text-white bg-[#0d1430]">
                <option value="" className="bg-[#0d1430] text-white">Select team</option>
                <option value="Community" className="bg-[#0d1430] text-white">Community</option>
                <option value="PDM" className="bg-[#0d1430] text-white">PDM</option>
                <option value="Tech" className="bg-[#0d1430] text-white">Tech</option>
                <option value="Consulting - East 1" className="bg-[#0d1430] text-white">Consulting - East 1</option>
                <option value="Consulting - East 2" className="bg-[#0d1430] text-white">Consulting - East 2</option>
                <option value="Consulting - East 3" className="bg-[#0d1430] text-white">Consulting - East 3</option>
                <option value="Consulting - East 4" className="bg-[#0d1430] text-white">Consulting - East 4</option>
                <option value="Consulting - East 5" className="bg-[#0d1430] text-white">Consulting - East 5</option>
                <option value="Consulting - East 6" className="bg-[#0d1430] text-white">Consulting - East 6</option>
                <option value="Consulting - East 7" className="bg-[#0d1430] text-white">Consulting - East 7</option>
                <option value="Consulting - East 8" className="bg-[#0d1430] text-white">Consulting - East 8</option>
                <option value="Consulting - West 1" className="bg-[#0d1430] text-white">Consulting - West 1</option>
                <option value="Consulting - West 2" className="bg-[#0d1430] text-white">Consulting - West 2</option>
                <option value="Other" className="bg-[#0d1430] text-white">Other</option>
              </select>
            ) : idea.team ? (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/8 text-white/50 border border-white/10">{idea.team}</span>
            ) : null}

            {isEditing ? (
              <select value={editForm?.time_to_implement ?? ''} onChange={(e) => setEditForm((f) => f ? { ...f, time_to_implement: e.target.value } : f)}
                className="border border-white/10 rounded-lg px-2 py-1 text-xs text-white bg-[#0d1430]">
                <option value="" className="bg-[#0d1430] text-white">No time estimate</option>
                <option value="< 5 mins" className="bg-[#0d1430] text-white">Less than 5 minutes</option>
                <option value="5–15 mins" className="bg-[#0d1430] text-white">5 to 15 minutes</option>
                <option value="15–30 mins" className="bg-[#0d1430] text-white">15 to 30 minutes</option>
                <option value="< 1 hour" className="bg-[#0d1430] text-white">Less than 1 hour</option>
                <option value="1–2 hours" className="bg-[#0d1430] text-white">1 to 2 hours</option>
                <option value="2+ hours" className="bg-[#0d1430] text-white">More than 2 hours</option>
              </select>
            ) : idea.time_to_implement ? (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/8 text-white/50 border border-white/10">⏱ {idea.time_to_implement}</span>
            ) : null}

            {isEditing
              ? allTags.map((tag) => (
                  <button key={tag.id} type="button"
                    onClick={() => setEditForm((f) => f ? {
                      ...f, selectedTags: f.selectedTags.includes(tag.id)
                        ? f.selectedTags.filter((t) => t !== tag.id)
                        : [...f.selectedTags, tag.id]
                    } : f)}
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      editForm?.selectedTags.includes(tag.id)
                        ? 'bg-[#4f86f7] text-white border-[#4f86f7]'
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}>
                    {tag.name}
                  </button>
                ))
              : idea.tags?.map((tag) => (
                  <span key={tag.id} className="text-xs font-medium text-white/50 bg-white/8 border border-white/10 px-2.5 py-1 rounded-full">
                    {tag.name}
                  </span>
                ))}
          </div>

          {!isEditing && (
            <button onClick={startEdit}
              className="text-xs text-white/30 hover:text-[#4f86f7] border border-white/10 px-3 py-1.5 rounded-lg hover:border-[#4f86f7]/40 transition-colors shrink-0">
              ✏️ Edit
            </button>
          )}
        </div>

        {/* Idea */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-white/30 mb-1">Idea Description & Expected Leverage</h2>
          {isEditing ? (
            <textarea rows={6} value={editForm?.idea ?? ''}
              onChange={(e) => setEditForm((f) => f ? { ...f, idea: e.target.value } : f)}
              className={inputCls} />
          ) : (
            <p className="text-white text-base leading-relaxed whitespace-pre-wrap">{idea.idea}</p>
          )}
        </div>

        {/* AI Platforms */}
        {(isEditing || (idea.ai_platforms?.length ?? 0) > 0) && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-white/30 mb-3">AI Platforms Used</h2>
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {AI_PLATFORMS.map((platform) => (
                  <button key={platform} type="button"
                    onClick={() => setEditForm((f) => f ? {
                      ...f,
                      ai_platforms: f.ai_platforms.includes(platform)
                        ? f.ai_platforms.filter((p) => p !== platform)
                        : [...f.ai_platforms, platform]
                    } : f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      editForm?.ai_platforms.includes(platform)
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                        : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                    }`}>
                    {platform}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {idea.ai_platforms?.map((platform) => (
                  <span key={platform} className="px-3 py-1.5 rounded-full text-xs font-medium bg-violet-500/15 text-violet-300 border border-violet-500/30">
                    {platform}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Links & Resources */}
        {(isEditing || links.github || links.sharepoint || (links.references?.length ?? 0) > 0) && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-white/30 mb-3">Links & Resources</h2>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-white/30 mb-1">GitHub / Gist</label>
                  <input type="url" value={editForm?.github ?? ''}
                    onChange={(e) => setEditForm((f) => f ? { ...f, github: e.target.value } : f)}
                    placeholder="https://github.com/..." className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1">SharePoint</label>
                  <div className="bg-[#4f86f7]/8 border border-[#4f86f7]/20 rounded-lg px-3 py-2 mb-2 text-xs text-[#4f86f7]/80">
                    📢 Please share the SharePoint folder/file with <strong>everyone at ZoomRx</strong> and include a document with step-by-step instructions so teammates can replicate your idea easily.
                  </div>
                  <input type="url" value={editForm?.sharepoint ?? ''}
                    onChange={(e) => setEditForm((f) => f ? { ...f, sharepoint: e.target.value } : f)}
                    placeholder="https://zoomrx.sharepoint.com/..." className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1">Reference links</label>
                  {editForm?.references.map((ref, i) => (
                    <div key={i} className="flex gap-2 mb-1">
                      <input type="url" value={ref}
                        onChange={(e) => {
                          const refs = [...(editForm.references)]
                          refs[i] = e.target.value
                          setEditForm((f) => f ? { ...f, references: refs } : f)
                        }}
                        placeholder="https://..." className={inputCls} />
                      {i > 0 && (
                        <button onClick={() => setEditForm((f) => f ? { ...f, references: f.references.filter((_, idx) => idx !== i) } : f)}
                          className="text-red-400 px-2">✕</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setEditForm((f) => f ? { ...f, references: [...f.references, ''] } : f)}
                    className="text-[#4f86f7] text-xs font-medium">+ Add reference</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {links.github && (
                  <a href={links.github} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-white/60 hover:text-[#4f86f7] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
                    <span>🐙</span> GitHub
                  </a>
                )}
                {links.sharepoint && (
                  <a href={links.sharepoint} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-white/60 hover:text-[#4f86f7] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
                    <span>📁</span> SharePoint
                  </a>
                )}
                {links.references?.filter(Boolean).map((ref, i) => (
                  <a key={i} href={ref} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-white/60 hover:text-[#4f86f7] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
                    <span>🔗</span> Reference {links.references!.filter(Boolean).length > 1 ? i + 1 : ''}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* POCs */}
        {(isEditing || (idea.poc_emails?.length ?? 0) > 0) && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-white/30 mb-3">Points of Contact</h2>
            {isEditing ? (
              <div>
                <input type="text" value={editForm?.poc_emails ?? ''}
                  onChange={(e) => setEditForm((f) => f ? { ...f, poc_emails: e.target.value } : f)}
                  placeholder={`e.g. john.doe@${ALLOWED_DOMAIN}, jane.smith@${ALLOWED_DOMAIN}`}
                  className={inputCls} />
                {editForm?.poc_emails.trim() && (() => {
                  const names = editForm.poc_emails.split(',')
                    .map((e) => e.trim().toLowerCase())
                    .filter((e) => e.endsWith(`@${ALLOWED_DOMAIN}`))
                    .map((e) => parseNameFromEmail(e))
                  return names.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {names.map((name, i) => (
                        <span key={i} className="flex items-center gap-1 bg-[#4f86f7]/10 text-[#4f86f7] text-xs px-2.5 py-1 rounded-full border border-[#4f86f7]/20">
                          <span className="w-4 h-4 rounded-full bg-[#4f86f7] flex items-center justify-center text-white font-bold text-[9px]">{name.charAt(0)}</span>
                          {name}
                        </span>
                      ))}
                    </div>
                  ) : null
                })()}
                <p className="text-white/25 text-xs mt-1">Separate multiple emails with commas</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {idea.poc_emails?.map((email, i) => {
                  const name = parseNameFromEmail(email)
                  return (
                    <span key={i} className="flex items-center gap-1.5 bg-[#4f86f7]/10 text-[#4f86f7] text-sm px-3 py-1.5 rounded-full border border-[#4f86f7]/20">
                      <span className="w-5 h-5 rounded-full bg-[#4f86f7] flex items-center justify-center text-white font-bold text-[10px]">{name.charAt(0)}</span>
                      {name}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 text-sm text-white/50">
            <div className="w-7 h-7 rounded-full bg-[#4f86f7] flex items-center justify-center text-white font-bold text-xs">
              {idea.person_name.charAt(0).toUpperCase()}
            </div>
            <span>{idea.person_name}</span>
            <span className="text-white/20">·</span>
            <span className="text-xs text-white/30">#{idea.s_no} · {formatDistanceToNow(idea.created_at)}</span>
            <span className="text-white/20">·</span>
            <span className="text-xs text-white/30">👁 {idea.views ?? 0} views</span>
          </div>

          {isEditing ? (
            <div className="flex gap-2">
              <button onClick={() => { setIsEditing(false); setEditForm(null) }}
                className="border border-white/10 text-white/50 px-4 py-1.5 rounded-lg text-sm hover:bg-white/5">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="bg-[#4f86f7] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[#3b72e0] disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Share button */}
              <div className="relative" ref={shareRef}>
                <button
                  onClick={() => setShareOpen((o) => !o)}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors">
                  ↗ Share
                </button>
                {shareOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-52 bg-[#0d1430] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
                    <button onClick={copyLink}
                      className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                      🔗 Copy link
                    </button>
                    <div className="border-t border-white/8" />
                    <button onClick={copyTeamsMessage}
                      className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                      💬 Copy as Teams message
                    </button>
                  </div>
                )}
              </div>
              <LikeButton ideaId={idea.id} initialCount={idea.like_count ?? 0} />
            </div>
          )}
        </div>
      </div>

      <ImplementationStatus ideaId={idea.id} />

      {/* Comments */}
      <div className="bg-[#0d1430] border border-white/10 rounded-2xl p-8 mb-6">
        <CommentSection ideaId={idea.id} />
      </div>

      {similarIdeas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-3">Similar Ideas</h3>
          <div className="space-y-2">
            {similarIdeas.map((s) => (
              <Link key={s.id} href={`/idea/${s.id}`} className="block bg-[#0d1430] border border-white/10 rounded-xl px-5 py-4 hover:border-[#4f86f7]/40 transition-colors group">
                <div className="flex items-center gap-2 mb-1">
                  {s.project && (
                    <span className="text-xs font-medium text-[#4f86f7] bg-[#4f86f7]/10 px-2 py-0.5 rounded-full">{s.project}</span>
                  )}
                  <span className="text-xs text-white/30">#{s.s_no}</span>
                </div>
                <p className="text-sm text-white/80 group-hover:text-white line-clamp-2 transition-colors">{s.idea}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
