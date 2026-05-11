'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BADGES, getEarnedBadges, UserStats } from '@/lib/badges'
import { getTimeFilterDate } from '@/lib/utils'

type LeaderboardEntry = {
  person_name: string
  idea_count: number
  total_likes: number
  total_views: number
  max_likes_single: number
  is_early_adopter: boolean
  badges: ReturnType<typeof getEarnedBadges>
}

const periods = [
  { value: 'all', label: 'All Time' },
  { value: 'month', label: 'This Month' },
  { value: 'week', label: 'This Week' },
]

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [period, setPeriod] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [period])

  async function fetchLeaderboard() {
    setLoading(true)

    const since = getTimeFilterDate(period)

    let ideasQuery = supabase
      .from('ideas')
      .select('id, person_name, created_at, views, like_count:likes(count)')
      .neq('status', 'Archived')

    if (since) ideasQuery = ideasQuery.gte('created_at', since)

    const { data: ideas } = await ideasQuery

    const { data: earliest } = await supabase
      .from('ideas')
      .select('person_name')
      .order('created_at', { ascending: true })
      .limit(5)

    const earlyAdopters = new Set((earliest ?? []).map((e: any) => e.person_name))

    const map: Record<string, { idea_count: number; total_likes: number; max_likes: number; total_views: number }> = {}

    for (const idea of ideas ?? []) {
      const name = idea.person_name
      const count = idea.like_count?.[0]?.count ?? 0
      if (!map[name]) map[name] = { idea_count: 0, total_likes: 0, max_likes: 0, total_views: 0 }
      map[name].idea_count += 1
      map[name].total_likes += count
      map[name].max_likes = Math.max(map[name].max_likes, count)
      map[name].total_views += idea.views ?? 0
    }

    const sorted = Object.entries(map).sort((a, b) => {
      if (b[1].idea_count !== a[1].idea_count) return b[1].idea_count - a[1].idea_count
      return b[1].total_likes - a[1].total_likes
    })

    const leaderboard: LeaderboardEntry[] = sorted.map(([name, stats], idx) => {
      const userStats: UserStats = {
        ideaCount: stats.idea_count,
        maxLikesOnSingleIdea: stats.max_likes,
        isMonthlyTop: idx === 0 && period !== 'all',
        isEarlyAdopter: earlyAdopters.has(name),
      }
      return {
        person_name: name,
        idea_count: stats.idea_count,
        total_likes: stats.total_likes,
        total_views: stats.total_views,
        max_likes_single: stats.max_likes,
        is_early_adopter: earlyAdopters.has(name),
        badges: getEarnedBadges(userStats),
      }
    })

    setEntries(leaderboard)
    setLoading(false)
  }

  const medals = ['🥇', '🥈', '🥉']

  const tierStyle = (i: number) => {
    if (i === 0) return 'border-2 border-yellow-400/60 bg-gradient-to-r from-yellow-500/10 to-amber-500/5 shadow-md shadow-yellow-500/10'
    if (i === 1) return 'border-2 border-slate-400/40 bg-gradient-to-r from-slate-400/10 to-slate-400/5 shadow-sm shadow-slate-400/10'
    if (i === 2) return 'border-2 border-orange-400/40 bg-gradient-to-r from-orange-400/10 to-orange-400/5 shadow-sm shadow-orange-400/10'
    return 'bg-[#0d1430] border border-white/10'
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-amber-500/20 via-[#0d1430] to-[#0d1430] border border-amber-500/20 rounded-2xl px-6 py-5 mb-8 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-2xl shrink-0">🏆</div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Leaderboard</h1>
          <p className="text-white/50 text-sm mt-0.5">Top idea contributors across ZoomRx</p>
        </div>
      </div>

      {/* Period filter */}
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
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[#0d1430] border border-white/10 rounded-2xl p-5 animate-pulse">
              <div className="h-5 bg-white/10 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <div className="text-5xl mb-4">🏆</div>
          <p>No ideas submitted in this period yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <div key={entry.person_name} className={`rounded-2xl p-5 flex items-center gap-4 ${tierStyle(i)}`}>
              <div className="text-2xl w-8 text-center">
                {i < 3 ? medals[i] : <span className="text-white/30 text-lg font-bold">#{i + 1}</span>}
              </div>

              <div className="w-10 h-10 rounded-full bg-[#4f86f7] flex items-center justify-center text-white font-bold">
                {entry.person_name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white">{entry.person_name}</span>
                  {entry.badges.map((b) => (
                    <span key={b.id} title={b.description} className="text-base cursor-help">{b.icon}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                  <span>💡 {entry.idea_count} idea{entry.idea_count !== 1 ? 's' : ''}</span>
                  <span>👍 {entry.total_likes} likes</span>
                  <span>👁 {entry.total_views} views</span>
                </div>
              </div>

              {entry.badges.length > 0 && (
                <div className="hidden sm:flex flex-wrap gap-1 max-w-[160px] justify-end">
                  {entry.badges.map((b) => (
                    <span key={b.id} title={b.description}
                      className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/50 cursor-help whitespace-nowrap">
                      {b.icon} {b.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Badge legend */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-white mb-4">Badges</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BADGES.map((b) => (
            <div key={b.id} className="bg-[#0d1430] border border-white/10 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">{b.icon}</span>
              <div>
                <p className="font-medium text-sm text-white">{b.name}</p>
                <p className="text-xs text-white/40 mt-0.5">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
