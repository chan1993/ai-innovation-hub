import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'AI Innovation Hub'
  const description =
    searchParams.get('description') || 'Discover and share AI ideas across ZoomRx'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #070d24 0%, #0d1540 60%, #0a1228 100%)',
          display: 'flex',
          flexDirection: 'column',
          padding: '64px 72px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle grid lines for texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Brand pill top-left */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: '999px',
            padding: '8px 20px',
            width: 'fit-content',
            marginBottom: '40px',
          }}
        >
          <span style={{ fontSize: '18px' }}>⚡</span>
          <span style={{ color: '#a5b4fc', fontSize: '18px', fontWeight: 600 }}>
            ZoomRx AI Innovation Hub
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            color: '#ffffff',
            fontSize: title.length > 70 ? '38px' : title.length > 45 ? '44px' : '52px',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.5px',
            flex: 1,
            display: 'flex',
            alignItems: 'flex-start',
          }}
        >
          💡 {title}
        </div>

        {/* Description */}
        <div
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: '22px',
            lineHeight: 1.55,
            marginTop: '16px',
            display: '-webkit-box',
            overflow: 'hidden',
          }}
        >
          {description.length > 140 ? description.slice(0, 140) + '…' : description}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '40px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '16px' }}>
            ai-innovation-hub-sable.vercel.app
          </span>
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '8px',
              padding: '6px 18px',
              color: '#a5b4fc',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            View Idea →
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
