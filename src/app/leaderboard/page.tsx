'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getTimeFilterDate } from '@/lib/utils'
import Link from 'next/link'

type ProjectEntry = {
  project: string
  idea_count: number
  total_likes: number
  total_views: number
  ideas: { id: string; idea: string; s_no: number; status: string }[]
  contributors: string[]
}

const periods = [
  { value: 'all', label: 'All Time' },
  { value: 'month', label: 'This Month' },
  { value: 'week', label: 'This Week' },
]

const medals = ['🥇', '🥈', '🥉']

const tierStyle = (i: number) => {
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

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<ProjectEntry[]>([])
  const [period, setPeriod] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [period])

  async function fetchLeaderboard() {
    setLoading(true)
    const since = getTimeFilterDate(period)

    let query = supabase
      .from('ideas')
      .select('id, s_no, idea, project, person_name, status, views, like_count:likes(count)')
      .neq('status', 'Archived')
      .not('project', 'is', null)

    if (since) query = query.gte('created_at', since)

    const { data: ideas } = await query

    const map: Record<string, { total_likes: number; total_views: number; ideas: ProjectEntry['ideas']; contributors: Set<string> }> = {}

    for (const idea of ideas ?? []) {
      const project = idea.project as string
      const likes = idea.like_count?.[0]?.count ?? 0
      if (!map[project]) map[project] = { total_likes: 0, total_views: 0, ideas: [], contributors: new Set() }
      map[project].total_likes += likes
      map[project].total_views += idea.views ?? 0
      map[project].ideas.push({ id: idea.id, idea: idea.idea, s_no: idea.s_no, status: idea.status })
      map[project].contributors.add(idea.person_name)
    }

    const sorted: ProjectEntry[] = Object.entries(map)
      .map(([project, stats]) => ({
        project,
        idea_count: stats.ideas.length,
        total_likes: stats.total_likes,
        total_views: stats.total_views,
        ideas: stats.ideas.slice(0, 3),
        contributors: [...stats.contributors],
      }))
      .sort((a, b) => b.total_likes !== a.total_likes ? b.total_likes - a.total_likes : b.idea_count - a.idea_count)

    setEntries(sorted)
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-amber-500/20 via-[#0d1430] to-[#0d1430] border border-amber-500/20 rounded-2xl px-6 py-5 mb-8 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-2xl shrink-0">🏆</div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Leaderboard</h1>
          <p className="text-white/50 text-sm mt-0.5">Top projects by community engagement</p>
        </div>
      </div>

      <div className="flex bg-white/8 rounded-xl p-1 w-fit mb-8">
        {periods.map((p) => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p.value ? 'bg-[#4f86f7] text-white shadow-sm' : 'text-white/50 hover:text-white'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

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
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <div className="text-5xl mb-4">🏆</div>
          <p>No project ideas in this period yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, i) => (
            <div key={entry.project} className={`rounded-2xl p-6 ${tierStyle(i)}`}>

              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="text-2xl w-8 text-center pt-0.5 shrink-0">
                  {i < 3 ? medals[i] : <span className="text-white/30 text-lg font-bold">#{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/project/${encodeURIComponent(entry.project)}`}
                    className="text-lg font-bold text-white hover:text-[#4f86f7] transition-colors"
                  >
                    {entry.project}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                    <span>💡 {entry.idea_count} idea{entry.idea_count !== 1 ? 's' : ''}</span>
                    <span>👍 {entry.total_likes} likes</span>
                    <span>👁 {entry.total_views} views</span>
                  </div>
                </div>
              </div>

              {/* Ideas list */}
              <div className="ml-11 space-y-1.5 mb-4">
                {entry.ideas.map((idea) => (
                  <Link
                    key={idea.id}
                    href={`/idea/${idea.id}`}
                    className="flex items-start gap-2 group"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${statusDot[idea.status] ?? statusDot['Idea']}`} />
                    <span className="text-sm text-white/60 group-hover:text-white/90 transition-colors line-clamp-1">
                      {idea.idea}
                    </span>
                  </Link>
                ))}
                {entry.idea_count > 3 && (
                  <Link href={`/project/${encodeURIComponent(entry.project)}`}
                    className="text-xs text-[#4f86f7]/60 hover:text-[#4f86f7] ml-3.5 transition-colors">
                    +{entry.idea_count - 3} more →
                  </Link>
                )}
              </div>

              {/* Contributors */}
              <div className="ml-11 flex flex-wrap gap-1.5 pt-3 border-t border-white/10">
                {entry.contributors.map((name) => (
                  <Link
                    key={name}
                    href={`/person/${encodeURIComponent(name)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 bg-white/5 hover:bg-[#4f86f7]/15 hover:text-[#4f86f7] text-white/50 text-xs px-2.5 py-1 rounded-full border border-white/10 hover:border-[#4f86f7]/30 transition-colors"
                  >
                    <span className="w-4 h-4 rounded-full bg-[#4f86f7] flex items-center justify-center text-white font-bold text-[9px]">
                      {name.charAt(0).toUpperCase()}
                    </span>
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
