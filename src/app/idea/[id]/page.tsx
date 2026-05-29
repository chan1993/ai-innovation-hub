import { Metadata } from 'next'
import IdeaDetailClient from './IdeaDetailClient'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-innovation-hub-sable.vercel.app'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const res = await fetch(
    `${supabaseUrl}/rest/v1/ideas?id=eq.${id}&select=project,idea,poc_emails,person_name`,
    {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      cache: 'no-store',
    }
  )
  const data = await res.json()
  const idea = data[0]
  if (!idea) return { title: 'AI Innovation Hub' }
  const description =
    idea.idea?.slice(0, 200) + (idea.idea?.length > 200 ? '...' : '')
  const ogImageUrl = `${siteUrl}/api/og?title=${encodeURIComponent(idea.project || 'AI Idea')}&description=${encodeURIComponent(description)}`
  return {
    title: `${idea.project} | ZoomRx AI Innovation Hub`,
    description,
    openGraph: {
      title: idea.project,
      description,
      type: 'article',
      siteName: 'ZoomRx AI Innovation Hub',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: idea.project }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [ogImageUrl],
    },
  }
}

export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <IdeaDetailClient id={id} />
}
