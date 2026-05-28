'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, Idea } from '@/lib/supabase'
import IdeaCard from '@/components/IdeaCard'
import Link from 'next/link'

export default function PersonPage() {
  const { name } = useParams<{ name: string }>()
  const decodedName = decodeURIComponent(name)

  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPersonIdeas() {
      const { data } = await supabase
        .from('ideas')
        .select(`
          *,
          tags:idea_tags(tag:tags(*)),
          like_count:likes(count),
          comment_count:comments(count)
        `)
        .neq('status', 'Archived')
        .ilike('person_name', decodedName)
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
    fetchPersonIdeas()
  }, [decodedName])

  const totalLikes = ideas.reduce((sum, i) => sum + (i.like_count ?? 0), 0)

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/" className="text-sm text-white/40 hover:text-white flex items-center gap-1 mb-6 transition-colors">
        ← Back to feed
      </Link>

      <div className="bg-gradient-to-br from-[#4f86f7]/20 via-[#0d1430] to-[#0d1430] border border-[#4f86f7]/20 rounded-2xl px-6 py-5 mb-8 flex items-center gap-4 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-[#4f86f7] flex items-center justify-center text-white font-bold text-2xl shrink-0">
          {decodedName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{decodedName}</h1>
          {!loading && (
            <div className="flex items-center gap-3 mt-1 text-sm text-white/50">
              <span>💡 {ideas.length} idea{ideas.length !== 1 ? 's' : ''}</span>
              <span>👍 {totalLikes} like{totalLikes !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#0d1430] border border-white/10 rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
              <div className="h-5 bg-white/10 rounded w-full mb-2" />
              <div className="h-4 bg-white/10 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <p className="text-lg">No ideas from {decodedName} yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  )
}
