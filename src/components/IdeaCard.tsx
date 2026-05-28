'use client'

import Link from 'next/link'
import { Idea } from '@/lib/supabase'
import { formatDistanceToNow } from '@/lib/utils'

type Props = { idea: Idea }

const statusConfig: Record<string, string> = {
  'Idea': 'bg-blue-500/15 text-blue-300',
  'In Progress': 'bg-yellow-500/15 text-yellow-300',
  'Implemented': 'bg-green-500/15 text-green-300',
  'Archived': 'bg-white/10 text-white/40',
}

export default function IdeaCard({ idea }: Props) {
  return (
    <Link href={`/idea/${idea.id}`} className="block group">
      <div className="relative bg-[#0d1430] border border-white/10 rounded-2xl p-6 hover:shadow-lg hover:shadow-black/30 hover:border-[#4f86f7]/40 transition-all duration-200 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4f86f7] to-violet-500" />

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig[idea.status] ?? statusConfig['Idea']}`}>
            {idea.status}
          </span>
          {idea.tags?.map((tag) => (
            <span key={tag.id} className="text-xs font-medium text-white/50 bg-white/8 px-2.5 py-1 rounded-full border border-white/10">
              {tag.name}
            </span>
          ))}
        </div>

        <h3 className="text-white font-bold text-lg leading-snug mb-2 group-hover:text-[#4f86f7] transition-colors line-clamp-1">
          {idea.project || 'Untitled Idea'}
        </h3>

        <p className="text-white/55 text-sm leading-relaxed line-clamp-2 mb-4">{idea.idea}</p>

        <div className="flex items-center justify-between text-xs text-white/40 pt-3 border-t border-white/10">
          <Link
            href={`/person/${encodeURIComponent(idea.person_name)}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 hover:text-[#4f86f7] transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-[#4f86f7] flex items-center justify-center text-white font-bold text-[10px]">
              {idea.person_name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-white/60">{idea.person_name}</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-0.5 font-semibold text-white/70">👍 {idea.like_count ?? 0}</span>
            <span>👁 {idea.views ?? 0}</span>
            {idea.comment_count !== undefined && <span>💬 {idea.comment_count}</span>}
            {idea.time_to_implement && <span className="text-white/40">⏱ {idea.time_to_implement}</span>}
            {((idea.impl_working ?? 0) > 0 || (idea.impl_not_working ?? 0) > 0 || (idea.impl_stuck ?? 0) > 0) && (
              <span className="flex items-center gap-1">
                {(idea.impl_working ?? 0) > 0 && <span>✅ {idea.impl_working}</span>}
                {(idea.impl_not_working ?? 0) > 0 && <span>⚠️ {idea.impl_not_working}</span>}
                {(idea.impl_stuck ?? 0) > 0 && <span>🔴 {idea.impl_stuck}</span>}
              </span>
            )}
            <span className="text-white/20">·</span>
            <span>#{idea.s_no}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
