'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase, Idea, Tag } from '@/lib/supabase'
import { formatDistanceToNow } from '@/lib/utils'

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY!

type Tab = 'ideas' | 'tags' | 'export'

function AdminContent() {
  const params = useSearchParams()
  const authorized = params.get('key') === ADMIN_KEY

  const [tab, setTab] = useState<Tab>('ideas')
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (authorized) {
      fetchIdeas()
      fetchTags()
    }
  }, [authorized])

  async function fetchIdeas() {
    setLoading(true)
    const { data } = await supabase
      .from('ideas')
      .select('*, tags:idea_tags(tag:tags(*)), like_count:likes(count), comment_count:comments(count)')
      .order('created_at', { ascending: false })

    if (data) {
      setIdeas(data.map((row: any) => ({
        ...row,
        tags: row.tags?.map((t: any) => t.tag).filter(Boolean) ?? [],
        like_count: row.like_count?.[0]?.count ?? 0,
        comment_count: row.comment_count?.[0]?.count ?? 0,
      })))
    }
    setLoading(false)
  }

  async function fetchTags() {
    const { data } = await supabase.from('tags').select('*').order('name')
    if (data) setTags(data)
  }

  async function setIdeaStatus(id: string, status: string) {
    await supabase.from('ideas').update({ status }).eq('id', id)
    setIdeas((prev) => prev.map((i) => i.id === id ? { ...i, status: status as Idea['status'] } : i))
  }

  async function deleteIdea(id: string) {
    await supabase.from('ideas').delete().eq('id', id)
    setIdeas((prev) => prev.filter((i) => i.id !== id))
    setConfirmDelete(null)
  }

  async function addTag() {
    const name = newTag.trim()
    if (!name) return
    const { data } = await supabase.from('tags').insert({ name }).select().single()
    if (data) { setTags((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name))); setNewTag('') }
  }

  async function deleteTag(id: string) {
    await supabase.from('tags').delete().eq('id', id)
    setTags((prev) => prev.filter((t) => t.id !== id))
  }

  async function exportBackup() {
    const [
      { data: ideas },
      { data: tags },
      { data: ideaTags },
      { data: likes },
      { data: comments },
      { data: implReports },
    ] = await Promise.all([
      supabase.from('ideas').select('*').order('s_no', { ascending: true }),
      supabase.from('tags').select('*').order('name'),
      supabase.from('idea_tags').select('*'),
      supabase.from('likes').select('*').order('created_at'),
      supabase.from('comments').select('*').order('created_at'),
      supabase.from('implementation_reports').select('*').order('created_at'),
    ])

    const backup = {
      exported_at: new Date().toISOString(),
      version: '1.0',
      tables: {
        ideas: ideas ?? [],
        tags: tags ?? [],
        idea_tags: ideaTags ?? [],
        likes: likes ?? [],
        comments: comments ?? [],
        implementation_reports: implReports ?? [],
      },
      summary: {
        ideas: ideas?.length ?? 0,
        tags: tags?.length ?? 0,
        likes: likes?.length ?? 0,
        comments: comments?.length ?? 0,
        implementation_reports: implReports?.length ?? 0,
      }
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-innovation-hub-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportCSV() {
    const { data } = await supabase
      .from('ideas')
      .select('*, tags:idea_tags(tag:tags(name)), like_count:likes(count)')
      .order('s_no', { ascending: true })

    if (!data) return

    const rows = data.map((row: any) => ({
      s_no: row.s_no,
      project: row.project,
      idea: row.idea,
      outcome: row.outcome,
      person: row.person_name,
      impact: row.impact,
      status: row.status,
      tags: (row.tags ?? []).map((t: any) => t.tag?.name).filter(Boolean).join('; '),
      likes: row.like_count?.[0]?.count ?? 0,
      links: (row.links ?? []).join('; '),
      date: new Date(row.created_at).toLocaleDateString(),
    }))

    const headers = Object.keys(rows[0])
    const csv = [headers.join(','), ...rows.map((r: any) => headers.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(','))].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-innovation-hub-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importBackup(file: File) {
    setImporting(true)
    setImportResult(null)
    try {
      const text = await file.text()
      const backup = JSON.parse(text)

      if (!backup.tables) throw new Error('Invalid backup file — missing tables key.')

      const { ideas, tags, idea_tags, likes, comments, implementation_reports } = backup.tables

      // Restore in dependency order: tags → ideas → joins/reactions
      if (tags?.length) {
        const { error } = await supabase.from('tags').upsert(tags, { onConflict: 'id' })
        if (error) throw new Error(`Tags: ${error.message}`)
      }

      if (ideas?.length) {
        const { error } = await supabase.from('ideas').upsert(ideas, { onConflict: 'id' })
        if (error) throw new Error(`Ideas: ${error.message}`)
      }

      if (idea_tags?.length) {
        const { error } = await supabase.from('idea_tags').upsert(idea_tags, { onConflict: 'idea_id,tag_id' })
        if (error) throw new Error(`Idea tags: ${error.message}`)
      }

      if (likes?.length) {
        const { error } = await supabase.from('likes').upsert(likes, { onConflict: 'id' })
        if (error) throw new Error(`Likes: ${error.message}`)
      }

      if (comments?.length) {
        const { error } = await supabase.from('comments').upsert(comments, { onConflict: 'id' })
        if (error) throw new Error(`Comments: ${error.message}`)
      }

      if (implementation_reports?.length) {
        const { error } = await supabase.from('implementation_reports').upsert(implementation_reports, { onConflict: 'id' })
        if (error) throw new Error(`Implementation reports: ${error.message}`)
      }

      const summary = backup.summary
      setImportResult({
        success: true,
        message: `Restored successfully — ${summary?.ideas ?? ideas?.length ?? 0} ideas, ${summary?.tags ?? tags?.length ?? 0} tags, ${summary?.likes ?? likes?.length ?? 0} likes, ${summary?.comments ?? comments?.length ?? 0} comments.`
      })
      fetchIdeas()
      fetchTags()
    } catch (err: any) {
      setImportResult({ success: false, message: err.message ?? 'Unknown error during import.' })
    }
    setImporting(false)
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-500 text-sm mt-2">Admin key required. Use <code className="bg-gray-100 px-1 rounded">/admin?key=YOUR_KEY</code></p>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'ideas', label: 'Ideas', icon: '💡' },
    { id: 'tags', label: 'Tags', icon: '🏷️' },
    { id: 'export', label: 'Export', icon: '📥' },
  ]

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Manage ideas, tags, and data</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">🔑 Authorized</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Ideas', value: ideas.length, icon: '💡' },
          { label: 'Implemented', value: ideas.filter((i) => i.status === 'Implemented').length, icon: '✅' },
          { label: 'Total Tags', value: tags.length, icon: '🏷️' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'ideas' && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : (
            ideas.map((idea) => (
              <div key={idea.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                {confirmDelete === idea.id && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
                    <span className="text-sm text-red-700">Delete this idea permanently?</span>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmDelete(null)}
                        className="text-xs text-gray-600 border border-gray-200 px-3 py-1 rounded-lg">Cancel</button>
                      <button onClick={() => deleteIdea(idea.id)}
                        className="text-xs text-white bg-red-600 px-3 py-1 rounded-lg">Delete</button>
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{idea.project}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        idea.status === 'Implemented' ? 'bg-green-100 text-green-700' :
                        idea.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>{idea.status}</span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium line-clamp-2">{idea.idea}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {idea.person_name} · #{idea.s_no} · {formatDistanceToNow(idea.created_at)} · 👍 {idea.like_count} · 💬 {idea.comment_count}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select value={idea.status} onChange={(e) => setIdeaStatus(idea.id, e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none">
                      <option value="Idea">💡 Idea</option>
                      <option value="In Progress">🔄 In Progress</option>
                      <option value="Implemented">✅ Implemented</option>
                      <option value="Archived">📦 Archived</option>
                    </select>
                    <button onClick={() => setConfirmDelete(idea.id)}
                      className="text-red-400 hover:text-red-600 text-sm px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'tags' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex gap-2 mb-6">
            <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              placeholder="New tag name..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={addTag}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
              Add
            </button>
          </div>
          <div className="space-y-2">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-800">{tag.name}</span>
                <button onClick={() => deleteTag(tag.id)}
                  className="text-red-400 hover:text-red-600 text-sm px-2 py-1 rounded hover:bg-red-50">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'export' && (
        <div className="space-y-4">

          {/* Full Backup */}
          <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🛡️</div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Full Backup <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full ml-1">Recommended</span></h2>
                <p className="text-gray-500 text-sm mb-1">Downloads <strong>everything</strong> — all ideas, tags, likes, comments, and implementation reports as a single JSON file.</p>
                <p className="text-gray-400 text-xs mb-4">Save this regularly. If Supabase or Vercel ever goes down, this file contains your complete dataset and can be used to restore the app.</p>
                <button onClick={exportBackup}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors text-sm">
                  🛡️ Download Full Backup (.json)
                </button>
              </div>
            </div>
          </div>

          {/* CSV Export */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">📊</div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Ideas CSV</h2>
                <p className="text-gray-500 text-sm mb-4">Download ideas only as a spreadsheet-friendly CSV. Good for sharing with stakeholders or reviewing in Excel.</p>
                <button onClick={exportCSV}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2.5 rounded-xl font-medium transition-colors text-sm">
                  📥 Download Ideas CSV
                </button>
              </div>
            </div>
          </div>

          {/* Import / Restore */}
          <div className="bg-white border border-orange-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">♻️</div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Restore from Backup</h2>
                <p className="text-gray-500 text-sm mb-1">Upload a <code className="bg-gray-100 px-1 rounded text-xs">.json</code> backup file to restore all ideas, tags, likes, comments, and implementation reports.</p>
                <p className="text-amber-600 text-xs mb-4">⚠️ This will upsert (add or overwrite) records by ID. Existing data that isn't in the backup file will not be deleted.</p>

                {importResult && (
                  <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${importResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {importResult.success ? '✅ ' : '❌ '}{importResult.message}
                  </div>
                )}

                <label className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm cursor-pointer transition-colors ${importing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
                  {importing ? '⏳ Restoring...' : '♻️ Upload Backup File'}
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    disabled={importing}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) importBackup(file)
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
      <AdminContent />
    </Suspense>
  )
}
