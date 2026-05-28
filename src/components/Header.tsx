'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getStoredName } from '@/lib/localStorage'
import { useEffect, useState } from 'react'

export default function Header() {
  const pathname = usePathname()
  const [name, setName] = useState('')

  useEffect(() => {
    setName(getStoredName())
  }, [])

  const nav = [
    { href: '/', label: 'Ideas' },
    { href: '/submit', label: 'Submit Idea' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/about', label: 'About' },
  ]

  return (
    <header className="bg-[#0d1430]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-40 shadow-sm shadow-black/20">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#4f86f7] flex items-center justify-center shadow-sm group-hover:bg-[#3b72e0] transition-colors">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <span className="font-bold text-lg text-white tracking-tight">Innovation Hub</span>
        </Link>

        <nav className="flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                pathname === item.href
                  ? 'bg-[#4f86f7] text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.label}
            </Link>
          ))}

          {name && (
            <div className="ml-3 flex items-center gap-2 text-sm border-l border-white/10 pl-3">
              <div className="w-8 h-8 rounded-full bg-[#4f86f7] flex items-center justify-center text-white font-semibold text-xs ring-2 ring-[#4f86f7]/30">
                {name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block font-medium text-white/70">{name}</span>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
