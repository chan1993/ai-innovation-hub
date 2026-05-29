'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getTimeFilterDate } from '@/lib/utils'
import Link from 'next/link'

type IdeaRow = {
  id: string
  s_no: number
  idea: string
  project: string
  person_name: string
  status: string
  views: number
  likes: number
  comments: number
}

type PersonEntry = {
  person_name: string
  idea_count: number
  total_likes: number
  total_views: number
  total_comments: number
  top_ideas: IdeaRow[]
}

const periods = [
  { value: 'all', label: 'All Time' },
  { value: 'month', label: 'This Month' },
  { value: 'week', label: 'This Week' },
]

const medals = ['🥇', '🥈', '🥉']

function tierStyle(i: number) {
  if (i === 0) return 'border-2 border-yellow-400/60 bg-gradient-to-r from-yellow-500/10 to-amber-500/5 shadow-md shadow-yellow-500/10'
  if (i === 1) return 'border-2 border-slate-400/40 bg-gradient-to-r from-slate-400/10 to-slate-400/5 shadow-sm shadow-slate-400/10'
  if (i === 2) return 'border-2 border-orange-400/40 bg-gradient-to-r from-orange-400/10 to-orange-400/5 shadow-sm shadow-orange-400/10'
  return 'bg-[#0d1430] border border-white/10'
}

const statusDot: Record<string, string> = {
  'Idea': 'bg-blue-400',
  'In Progress': 'bg-yellow-400',
  'Implemented': 'bg-emerald-400',
  'Archived': 'bg-white/30',
}

function rankIdeas(ideas: IdeaRow[]): IdeaRow[] {
  return [...ideas].sort((a, b) =>
    b.likes !== a.likes ? b.likes - a.likes :
    b.views !== a.views ? b.views - a.views :
    b.comments - a.comments
  )
}

function buildPeopleEntries(ideas: IdeaRow[]): PersonEntry[] {
  const map: Record<string, IdeaRow[]> = {}
  for (const idea of ideas) {
    if (!map[idea.person_name]) map[idea.person_name] = []
    map[idea.person_name].push(idea)
  }
  return Object.entries(map)
    .map(([person_name, rows]) => ({
      person_name,
      idea_count: rows.length,
      total_likes: rows.reduce((s, r) => s + r.likes, 0),
      total_views: rows.reduce((s, r) => s + r.views, 0),
      total_comments: rows.reduce((s, r) => s + r.comments, 0),
      top_ideas: rankIdeas(rows).slice(0, 3),
    }))
    .sort((a, b) =>
      b.idea_count !== a.idea_count ? b.idea_count - a.idea_count :
      b.total_likes !== a.total_likes ? b.total_likes - a.total_likes :
      b.total_views !== a.total_views ? b.total_views - a.total_views :
      b.total_comments - a.total_comments
    )
}

export default function LeaderboardPage() {
  const [allIdeas, setAllIdeas] = useState<IdeaRow[]>([])
  const [period, setPeriod] = useState('all')
  const [tab, setTab] = useState<'people' | 'ideas'>('people')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [period])

  async function fetchData() {
    setLoading(true)
    const since = getTimeFilterDate(period)

    let query = supabase
      .from('ideas')
      .select('id, s_no, idea, project, person_name, status, views, like_count:likes(count), comment_count:comments(count)')
      .neq('status', 'Archived')

    if (since) query = query.gte('created_at', since)

    const { data } = await query

    const rows: IdeaRow[] = (data ?? []).map((d) => ({
      id: d.id,
      s_no: d.s_no,
      idea: d.idea,
      project: d.project,
      person_name: d.person_name,
      status: d.status,
      views: d.views ?? 0,
      likes: (d.like_count as { count: number }[])?.[0]?.count ?? 0,
      comments: (d.comment_count as { count: number }[])?.[0]?.count ?? 0,
    }))

    setAllIdeas(rows)
    setLoading(false)
  }

  const peopleEntries = buildPeopleEntries(allIdeas)
  const ideaEntries = rankIdeas(allIdeas)

  const isEmpty = tab === 'people' ? peopleEntries.length === 0 : ideaEntries.length === 0

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500/20 via-[#0d1430] to-[#0d1430] border border-amber-500/20 rounded-2xl px-6 py-5 mb-8 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-2xl shrink-0">🏆</div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Leaderboard</h1>
          <p className="text-white/50 text-sm mt-0.5">Top contributors ranked by ideas shared</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
        <div className="flex bg-white/8 rounded-xl p-1">
          {(['people', 'ideas'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-[#4f86f7] text-white shadow-sm' : 'text-white/50 hover:text-white'
              }`}>
              {t === 'people' ? '👤 People' : '💡 Ideas'}
            </button>
          ))}
        </div>
        <div className="flex bg-white/8 rounded-xl p-1">
          {periods.map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p.value ? 'bg-[#4f86f7] text-white shadow-sm' : 'text-white/50 hover:text-white'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort hint */}
      <p className="text-xs text-white/25 mb-4 text-right">
        {tab === 'people'
          ? 'Ranked by: ideas → likes → views → comments'
          : 'Ranked by: likes → views → comments'}
      </p>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#0d1430] border border-white/10 rounded-2xl p-6 animate-pulse space-y-3">
              <div className="h-5 bg-white/10 rounded w-1/3" />
              <div className="h-4 bg-white/10 rounded w-full" />
              <div className="h-4 bg-white/10 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div className="text-center py-20 text-white/40">
          <div className="text-5xl mb-4">{tab === 'people' ? '👤' : '💡'}</div>
          <p>No {tab === 'people' ? 'contributors' : 'ideas'} in this period yet.</p>
        </div>
      ) : tab === 'people' ? (

        /* ── People list ── */
        <div className="space-y-4">
          {peopleEntries.map((entry, i) => (
            <div key={entry.person_name} className={`rounded-2xl p-6 ${tierStyle(i)}`}>

              {/* Person header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="text-2xl w-8 text-center pt-0.5 shrink-0">
                  {i < 3 ? medals[i] : <span className="text-white/30 text-lg font-bold">#{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/person/${encodeURIComponent(entry.person_name)}`}
                    className="text-lg font-bold text-white hover:text-[#4f86f7] transition-colors">
                    {entry.person_name}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/40 flex-wrap">
                    <span>💡 {entry.idea_count} idea{entry.idea_count !== 1 ? 's' : ''}</span>
                    <span>👍 {entry.total_likes} likes</span>
                    <span>👁 {entry.total_views} views</span>
                    <span>💬 {entry.total_comments} comments</span>
                  </div>
                </div>
              </div>

              {/* Top ideas for this person */}
              <div className="ml-11 space-y-1.5">
                {entry.top_ideas.map((idea) => (
                  <Link key={idea.id} href={`/idea/${idea.id}`} className="flex items-start gap-2 group">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${statusDot[idea.status] ?? statusDot['Idea']}`} />
                    <span className="text-sm text-white/60 group-hover:text-white/90 transition-colors line-clamp-1 flex-1">
                      {idea.idea}
                    </span>
                    <span className="text-xs text-white/25 shrink-0">👍 {idea.likes}</span>
                  </Link>
                ))}
                {entry.idea_count > 3 && (
                  <Link href={`/person/${encodeURIComponent(entry.person_name)}`}
                    className="text-xs text-[#4f86f7]/60 hover:text-[#4f86f7] ml-3.5 transition-colors">
                    +{entry.idea_count - 3} more →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

      ) : (

        /* ── Ideas list ── */
        <div className="space-y-3">
          {ideaEntries.map((idea, i) => (
            <Link key={idea.id} href={`/idea/${idea.id}`}
              className={`flex items-start gap-3 rounded-2xl p-5 ${tierStyle(i)} hover:opacity-90 transition-opacity`}>
              <div className="text-2xl w-8 text-center pt-0.5 shrink-0">
                {i < 3 ? medals[i] : <span className="text-white/30 text-lg font-bold">#{i + 1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${statusDot[idea.status] ?? statusDot['Idea']}`} />
                  <span className="text-white font-semibold text-sm line-clamp-2 leading-snug">{idea.idea}</span>
                </div>
                <div className="text-xs text-white/35 mb-2 ml-3.5">{idea.project} · {idea.person_name}</div>
                <div className="flex items-center gap-3 text-xs text-white/40 ml-3.5">
                  <span>👍 {idea.likes}</span>
                  <span>👁 {idea.views}</span>
                  <span>💬 {idea.comments}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

      )}
    </div>
  )
}
