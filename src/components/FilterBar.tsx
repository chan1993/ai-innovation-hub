'use client'

import { Tag } from '@/lib/supabase'

export type Filters = {
  search: string
  tag: string
  status: string
  period: string
  sort: string
}

type Props = {
  filters: Filters
  onChange: (filters: Filters) => void
  tags: Tag[]
}

const periods = [
  { value: 'all', label: 'All Time' },
  { value: 'month', label: 'This Month' },
  { value: 'week', label: 'This Week' },
  { value: 'today', label: 'Today' },
]

const sorts = [
  { value: 'newest', label: 'Newest' },
  { value: 'likes', label: 'Most Liked' },
  { value: 'views', label: 'Most Viewed' },
  { value: 'oldest', label: 'Oldest' },
]

const statuses = ['Idea', 'In Progress', 'Implemented']

export default function FilterBar({ filters, onChange, tags }: Props) {
  function update(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value })
  }

  const isFiltered = filters.search || filters.tag || filters.status || filters.period !== 'all' || filters.sort !== 'newest'

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Search ideas, projects, people..."
        value={filters.search}
        onChange={(e) => update('search', e.target.value)}
        className="w-full border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#4f86f7] focus:border-transparent bg-white/5"
      />

      <div className="flex flex-wrap gap-2">
        {/* Time filter */}
        <div className="flex bg-white/8 rounded-lg p-0.5 gap-0.5">
          {periods.map((p) => (
            <button key={p.value} onClick={() => update('period', p.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filters.period === p.value
                  ? 'bg-[#4f86f7] text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="relative">
          <select value={filters.sort} onChange={(e) => update('sort', e.target.value)}
            className="appearance-none border border-white/10 rounded-lg pl-3 pr-7 py-1.5 text-xs text-white/70 bg-[#0d1430] focus:outline-none focus:ring-2 focus:ring-[#4f86f7] cursor-pointer">
            {sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>

        {/* Status */}
        <div className="relative">
          <select value={filters.status} onChange={(e) => update('status', e.target.value)}
            className="appearance-none border border-white/10 rounded-lg pl-3 pr-7 py-1.5 text-xs text-white/70 bg-[#0d1430] focus:outline-none focus:ring-2 focus:ring-[#4f86f7] cursor-pointer">
            <option value="">All Stages</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>

        {/* Tags */}
        <div className="relative">
          <select value={filters.tag} onChange={(e) => update('tag', e.target.value)}
            className="appearance-none border border-white/10 rounded-lg pl-3 pr-7 py-1.5 text-xs text-white/70 bg-[#0d1430] focus:outline-none focus:ring-2 focus:ring-[#4f86f7] cursor-pointer">
            <option value="">All Tags</option>
            {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>

        {isFiltered && (
          <button onClick={() => onChange({ search: '', tag: '', status: '', period: 'all', sort: 'newest' })}
            className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 font-medium">
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
