'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, Idea, Tag, IdeaLinks } from '@/lib/supabase'
import LikeButton from '@/components/LikeButton'
import CommentSection from '@/components/CommentSection'
import { formatDistanceToNow, parseNameFromEmail } from '@/lib/utils'
import { getStoredEmail, setStoredEmail } from '@/lib/localStorage'
import Link from 'next/link'

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_DOMAIN!

const statusConfig: Record<string, { label: string; className: string }> = {
  'Idea': { label: '💡 Idea', className: 'bg-blue-500/15 text-blue-300' },
  'In Progress': { label: '🔄 In Progress', className: 'bg-yellow-500/15 text-yellow-300' },
  'Implemented': { label: '✅ Implemented', className: 'bg-green-500/15 text-green-300' },
  'Archived': { label: '📦 Archived', className: 'bg-white/10 text-white/40' },
}

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [idea, setIdea] = useState<Idea | null>(null)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  const [verifying, setVerifying] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<{
    project: string; idea: string; outcome: string
    status: string; selectedTags: string[]
    github: string; demo: string; sharepoint: string; references: string[]
  } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchIdea()
    supabase.from('tags').select('*').order('name').then(({ data }) => {
      if (data) setAllTags(data)
    })
  }, [id])

  async function fetchIdea() {
    await supabase.rpc('increment_views', { idea_id: id })

    const { data } = await supabase
      .from('ideas')
      .select('*, tags:idea_tags(tag:tags(*)), like_count:likes(count)')
      .eq('id', id)
      .single()

    if (data) {
      setIdea({
        ...data,
        tags: data.tags?.map((t: any) => t.tag).filter(Boolean) ?? [],
        like_count: data.like_count?.[0]?.count ?? 0,
        links: data.links ?? {},
      })
    }
    setLoading(false)
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
      outcome: idea?.outcome ?? '',
      status: idea?.status ?? 'Idea',
      selectedTags: idea?.tags?.map((t) => t.id) ?? [],
      github: links.github ?? '',
      demo: links.demo ?? '',
      sharepoint: links.sharepoint ?? '',
      references: links.references?.length ? links.references : [''],
    })
    setIsEditing(true)
  }

  async function handleSave() {
    if (!idea || !editForm) return
    setSaving(true)
    const links: IdeaLinks = {
      github: editForm.github.trim() || undefined,
      demo: editForm.demo.trim() || undefined,
      sharepoint: editForm.sharepoint.trim() || undefined,
      references: editForm.references.filter((r) => r.trim()),
    }

    await supabase.from('ideas').update({
      project: editForm.project,
      idea: editForm.idea,
      outcome: editForm.outcome,
      status: editForm.status,
      links,
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

        {/* Badges row */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {isEditing ? (
              <input value={editForm?.project ?? ''} onChange={(e) => setEditForm((f) => f ? { ...f, project: e.target.value } : f)}
                className="border border-white/10 rounded-lg px-3 py-1 text-sm text-white bg-white/5" />
            ) : (
              <span className="text-sm font-medium text-[#4f86f7] bg-[#4f86f7]/15 px-3 py-1 rounded-full">{idea.project}</span>
            )}

            {isEditing ? (
              <select value={editForm?.status ?? 'Idea'} onChange={(e) => setEditForm((f) => f ? { ...f, status: e.target.value } : f)}
                className="border border-white/10 rounded-lg px-2 py-1 text-xs text-white bg-[#0d1430]">
                <option value="Idea">💡 Idea</option>
                <option value="In Progress">🔄 In Progress</option>
                <option value="Implemented">✅ Implemented</option>
              </select>
            ) : (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.className}`}>{statusInfo.label}</span>
            )}

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
        <div className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-white/30 mb-1">The Idea</h2>
          {isEditing ? (
            <textarea rows={4} value={editForm?.idea ?? ''}
              onChange={(e) => setEditForm((f) => f ? { ...f, idea: e.target.value } : f)}
              className={inputCls} />
          ) : (
            <p className="text-white text-base leading-relaxed">{idea.idea}</p>
          )}
        </div>

        {/* Outcome */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-white/30 mb-1">Expected Outcome</h2>
          {isEditing ? (
            <textarea rows={3} value={editForm?.outcome ?? ''}
              onChange={(e) => setEditForm((f) => f ? { ...f, outcome: e.target.value } : f)}
              className={inputCls} />
          ) : (
            <p className="text-white/70 leading-relaxed">{idea.outcome}</p>
          )}
        </div>

        {/* Links */}
        {(isEditing || links.github || links.demo || links.sharepoint || (links.references?.length ?? 0) > 0) && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-white/30 mb-3">Links</h2>
            {isEditing ? (
              <div className="space-y-2">
                {[
                  { key: 'github', label: 'GitHub / Gist', placeholder: 'https://github.com/...' },
                  { key: 'demo', label: 'Demo', placeholder: 'https://loom.com/...' },
                  { key: 'sharepoint', label: 'SharePoint', placeholder: 'https://zoomrx.sharepoint.com/...' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs text-white/30 mb-1">{label}</label>
                    <input type="url"
                      value={(editForm as any)?.[key] ?? ''}
                      onChange={(e) => setEditForm((f) => f ? { ...f, [key]: e.target.value } : f)}
                      placeholder={placeholder}
                      className={inputCls} />
                  </div>
                ))}
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
                        placeholder="https://..."
                        className={inputCls} />
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
                {links.demo && (
                  <a href={links.demo} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-white/60 hover:text-[#4f86f7] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
                    <span>🎬</span> Demo
                  </a>
                )}
                {links.sharepoint && (
                  <a href={links.sharepoint} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-white/60 hover:text-[#4f86f7] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
                    <span>📄</span> SharePoint
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
            <LikeButton ideaId={idea.id} initialCount={idea.like_count ?? 0} />
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="bg-[#0d1430] border border-white/10 rounded-2xl p-8">
        <CommentSection ideaId={idea.id} />
      </div>
    </div>
  )
}
