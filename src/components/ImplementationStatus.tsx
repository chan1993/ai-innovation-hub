'use client'

import { useEffect, useState } from 'react'
import { supabase, ImplementationReport } from '@/lib/supabase'
import { getStoredName } from '@/lib/localStorage'
import NamePrompt from './NamePrompt'

type Props = { ideaId: string }

type StatusKey = 'working' | 'not_working' | 'stuck'

const STATUS_CONFIG: { key: StatusKey; label: string; icon: string }[] = [
  { key: 'working', label: 'Implemented & working', icon: '✅' },
  { key: 'not_working', label: 'Implemented but not working', icon: '⚠️' },
  { key: 'stuck', label: 'Stuck / unable to implement', icon: '🔴' },
]

export default function ImplementationStatus({ ideaId }: Props) {
  const [reports, setReports] = useState<ImplementationReport[]>([])
  const [myStatus, setMyStatus] = useState<StatusKey | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<StatusKey | null>(null)

  useEffect(() => {
    fetchReports()
  }, [ideaId])

  async function fetchReports() {
    const { data } = await supabase
      .from('implementation_reports')
      .select('*')
      .eq('idea_id', ideaId)
    if (data) {
      setReports(data)
      const name = getStoredName()
      if (name) {
        const mine = data.find((r: ImplementationReport) => r.person_name === name)
        setMyStatus(mine?.status ?? null)
      }
    }
  }

  async function handleSelect(status: StatusKey, name: string) {
    setLoading(true)
    if (myStatus === status) {
      await supabase
        .from('implementation_reports')
        .delete()
        .eq('idea_id', ideaId)
        .eq('person_name', name)
      setMyStatus(null)
    } else {
      await supabase
        .from('implementation_reports')
        .upsert({ idea_id: ideaId, person_name: name, status }, { onConflict: 'idea_id,person_name' })
      setMyStatus(status)
    }
    await fetchReports()
    setLoading(false)
  }

  function onClick(status: StatusKey) {
    if (loading) return
    const name = getStoredName()
    if (!name) {
      setPendingStatus(status)
      setShowPrompt(true)
      return
    }
    handleSelect(status, name)
  }

  const counts = STATUS_CONFIG.reduce((acc, s) => {
    acc[s.key] = reports.filter((r) => r.status === s.key).length
    return acc
  }, {} as Record<StatusKey, number>)

  return (
    <>
      {showPrompt && (
        <NamePrompt
          message="Enter your email to report your implementation experience."
          onComplete={(name) => {
            setShowPrompt(false)
            if (pendingStatus) {
              const s = pendingStatus
              setPendingStatus(null)
              handleSelect(s, name)
            }
          }}
        />
      )}
      <div className="bg-[#0d1430] border border-white/10 rounded-2xl p-6 mb-6">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-4">Have you tried this?</h3>
        <div className="flex flex-wrap gap-3">
          {STATUS_CONFIG.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => onClick(key)}
              disabled={loading}
              title={label}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                myStatus === key
                  ? 'bg-[#4f86f7]/20 border-[#4f86f7] text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-[#4f86f7]/40 hover:text-white'
              }`}
            >
              <span>{icon}</span>
              <span>{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
