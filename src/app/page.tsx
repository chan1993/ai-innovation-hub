'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, Idea, Tag } from '@/lib/supabase'
import IdeaCard from '@/components/IdeaCard'
import FilterBar, { Filters } from '@/components/FilterBar'
import { getTimeFilterDate } from '@/lib/utils'
import Link from 'next/link'

const DEFAULT_FILTERS: Filters = {
  search: '',
  tag: '',
  status: '',
  period: 'all',
  sort: 'newest',
}

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('tags').select('*').order('name').then(({ data }) => {
      if (data) setTags(data)
    })
  }, [])

  const fetchIdeas = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('ideas')
      .select(`
        *,
        tags:idea_tags(tag:tags(*)),
        like_count:likes(count),
        comment_count:comments(count)
      `)
      .neq('status', 'Archived')

    if (filters.status) query = query.eq('status', filters.status)

    const since = getTimeFilterDate(filters.period)
    if (since) query = query.gte('created_at', since)

    if (filters.sort === 'oldest') {
      query = query.order('created_at', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) { setLoading(false); return }

    let results: Idea[] = (data || []).map((row: any) => ({
      ...row,
      tags: row.tags?.map((t: any) => t.tag).filter(Boolean) ?? [],
      like_count: row.like_count?.[0]?.count ?? 0,
      comment_count: row.comment_count?.[0]?.count ?? 0,
    }))

    if (filters.tag) {
      results = results.filter((i) => i.tags?.some((t) => t.id === filters.tag))
    }

    if (filters.search) {
      const q = filters.search.toLowerCase()
      results = results.filter(
        (i) =>
          i.idea.toLowerCase().includes(q) ||
          i.project.toLowerCase().includes(q) ||
          i.person_name.toLowerCase().includes(q) ||
          i.outcome.toLowerCase().includes(q)
      )
    }

    if (filters.sort === 'likes') {
      results.sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0))
    } else if (filters.sort === 'views') {
      results.sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    }

    setIdeas(results)
    setLoading(false)
  }, [filters])

  useEffect(() => { fetchIdeas() }, [fetchIdeas])

  return (
    <div>
      <div className="bg-gradient-to-br from-[#4f86f7]/20 via-[#0d1430] to-[#0d1430] border border-[#4f86f7]/20 rounded-2xl px-6 py-5 mb-6 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Ideas Feed</h1>
          <p className="text-white/50 text-sm mt-1">
            {loading ? 'Loading...' : `${ideas.length} idea${ideas.length !== 1 ? 's' : ''} across ZoomRx`}
          </p>
        </div>
        <Link
          href="/submit"
          className="bg-[#4f86f7] hover:bg-[#3b72e0] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm shadow-[#4f86f7]/30"
        >
          + Submit Idea
        </Link>
      </div>

      <div className="mb-6">
        <FilterBar filters={filters} onChange={setFilters} tags={tags} />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#0d1430] border border-white/10 rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
              <div className="h-5 bg-white/10 rounded w-full mb-2" />
              <div className="h-4 bg-white/10 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[#4f86f7]/15 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💡</span>
          </div>
          <p className="text-lg font-semibold text-white">No ideas found</p>
          <p className="text-sm text-white/40 mt-1 mb-5">Try adjusting your filters or be the first to submit!</p>
          <Link href="/submit" className="inline-flex items-center gap-1.5 bg-[#4f86f7] hover:bg-[#3b72e0] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Submit the first idea
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  )
}
