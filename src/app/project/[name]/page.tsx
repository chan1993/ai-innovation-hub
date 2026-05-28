'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, Idea } from '@/lib/supabase'
import IdeaCard from '@/components/IdeaCard'
import Link from 'next/link'

export default function ProjectPage() {
  const { name } = useParams<{ name: string }>()
  const projectName = decodeURIComponent(name)

  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchIdeas() {
      const { data } = await supabase
        .from('ideas')
        .select('*, tags:idea_tags(tag:tags(*)), like_count:likes(count)')
        .eq('project', projectName)
        .neq('status', 'Archived')
        .order('created_at', { ascending: false })

      if (data) {
        setIdeas(data.map((d: any) => ({
          ...d,
          tags: d.tags?.map((t: any) => t.tag).filter(Boolean) ?? [],
          like_count: d.like_count?.[0]?.count ?? 0,
          links: d.links ?? {},
        })))
      }
      setLoading(false)
    }
    fetchIdeas()
  }, [projectName])

  const totalLikes = ideas.reduce((sum, i) => sum + (i.like_count ?? 0), 0)
  const totalViews = ideas.reduce((sum, i) => sum + (i.views ?? 0), 0)
  const contributors = [...new Set(ideas.map((i) => i.person_name))]

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/leaderboard" className="text-sm text-white/40 hover:text-white flex items-center gap-1 mb-6 transition-colors">
        ← Back to Leaderboard
      </Link>

      <div className="bg-gradient-to-br from-[#4f86f7]/20 via-[#0d1430] to-[#0d1430] border border-[#4f86f7]/20 rounded-2xl px-6 py-5 mb-8 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#4f86f7]/15 flex items-center justify-center text-2xl shrink-0">📁</div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{projectName}</h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
              <span>💡 {ideas.length} idea{ideas.length !== 1 ? 's' : ''}</span>
              <span>👍 {totalLikes} likes</span>
              <span>👁 {totalViews} views</span>
            </div>
          </div>
        </div>

        {contributors.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/10">
            <span className="text-xs text-white/30 mr-1 self-center">Contributors</span>
            {contributors.map((name) => (
              <Link
                key={name}
                href={`/person/${encodeURIComponent(name)}`}
                className="flex items-center gap-1 bg-white/5 hover:bg-[#4f86f7]/15 hover:text-[#4f86f7] text-white/50 text-xs px-2.5 py-1 rounded-full border border-white/10 hover:border-[#4f86f7]/30 transition-colors"
              >
                <span className="w-4 h-4 rounded-full bg-[#4f86f7] flex items-center justify-center text-white font-bold text-[9px]">
                  {name.charAt(0).toUpperCase()}
                </span>
                {name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#0d1430] border border-white/10 rounded-2xl p-6 animate-pulse space-y-3">
              <div className="h-5 bg-white/10 rounded w-1/2" />
              <div className="h-4 bg-white/10 rounded w-full" />
            </div>
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <p>No ideas found for this project.</p>
          <Link href="/" className="text-[#4f86f7] text-sm mt-2 inline-block">← Browse all ideas</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)}
        </div>
      )}
    </div>
  )
}
