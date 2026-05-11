'use client'

import { useEffect, useState } from 'react'
import { supabase, Comment } from '@/lib/supabase'
import { getStoredName } from '@/lib/localStorage'
import NamePrompt from './NamePrompt'
import { formatDistanceToNow } from '@/lib/utils'

type Props = { ideaId: string }

export default function CommentSection({ ideaId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [ideaId])

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
  }

  async function submitComment(name: string) {
    if (!text.trim()) return
    setLoading(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({ idea_id: ideaId, person_name: name, content: text.trim() })
      .select()
      .single()

    if (!error && data) {
      setComments((prev) => [...prev, data])
      setText('')
    }
    setLoading(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    const name = getStoredName()
    if (!name) {
      setPendingSubmit(true)
      setShowPrompt(true)
      return
    }
    submitComment(name)
  }

  return (
    <div>
      {showPrompt && (
        <NamePrompt
          message="Enter your name to post a comment."
          onComplete={(name) => {
            setShowPrompt(false)
            if (pendingSubmit) {
              setPendingSubmit(false)
              submitComment(name)
            }
          }}
        />
      )}

      <h3 className="text-lg font-semibold text-white mb-4">
        Discussion <span className="text-white/30 font-normal text-sm">({comments.length})</span>
      </h3>

      <div className="space-y-4 mb-6">
        {comments.length === 0 && (
          <p className="text-white/30 text-sm text-center py-6">No comments yet. Be the first!</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#4f86f7] flex items-center justify-center text-white font-bold text-xs shrink-0">
              {c.person_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-white">{c.person_name}</span>
                <span className="text-xs text-white/30">{formatDistanceToNow(c.created_at)}</span>
              </div>
              <p className="text-sm text-white/70 whitespace-pre-wrap">{c.content}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white bg-white/5 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#4f86f7] focus:border-transparent"
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="bg-[#4f86f7] hover:bg-[#3b72e0] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          Post
        </button>
      </form>
    </div>
  )
}
