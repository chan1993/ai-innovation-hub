'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getStoredName } from '@/lib/localStorage'
import NamePrompt from './NamePrompt'

type Props = {
  ideaId: string
  initialCount: number
}

export default function LikeButton({ ideaId, initialCount }: Props) {
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  async function handleLike(name: string) {
    if (liked || loading) return
    setLoading(true)
    const { error } = await supabase
      .from('likes')
      .insert({ idea_id: ideaId, person_name: name })

    if (!error) {
      setCount((c) => c + 1)
      setLiked(true)
    }
    setLoading(false)
  }

  function onClick() {
    if (liked) return
    const name = getStoredName()
    if (!name) {
      setShowPrompt(true)
      return
    }
    handleLike(name)
  }

  return (
    <>
      {showPrompt && (
        <NamePrompt
          message="Enter your name to like this idea."
          onComplete={(name) => {
            setShowPrompt(false)
            handleLike(name)
          }}
        />
      )}
      <button
        onClick={onClick}
        disabled={liked || loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
          liked
            ? 'bg-[#4f86f7]/20 text-[#4f86f7] cursor-default'
            : 'bg-white/10 text-white/70 hover:bg-[#4f86f7]/20 hover:text-[#4f86f7]'
        }`}
      >
        <span className="text-lg">👍</span>
        <span>{count}</span>
        {liked && <span className="text-xs">Liked!</span>}
      </button>
    </>
  )
}
