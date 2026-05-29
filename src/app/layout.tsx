import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-innovation-hub-sable.vercel.app'
const defaultOgImage = `${siteUrl}/api/og?title=AI+Innovation+Hub&description=Discover+and+share+AI+ideas+across+ZoomRx`

export const metadata: Metadata = {
  title: 'AI Innovation Hub',
  description: 'Discover and share AI ideas across ZoomRx',
  openGraph: {
    title: 'ZoomRx AI Innovation Hub',
    description: 'Discover and share AI ideas across ZoomRx',
    siteName: 'ZoomRx AI Innovation Hub',
    images: [{ url: defaultOgImage, width: 1200, height: 630, alt: 'ZoomRx AI Innovation Hub' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [defaultOgImage],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#080d1e] min-h-screen`}>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
