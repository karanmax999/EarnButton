import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'EarnButton — One-tap DeFi Yield on Base'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1428 50%, #0a0f1e 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid dot pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Teal glow */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '400px',
            background: 'radial-gradient(ellipse, rgba(0,200,150,0.15) 0%, transparent 70%)',
          }}
        />

        {/* Logo pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0',
            marginBottom: '36px',
            background: 'linear-gradient(135deg, #c8f56a 0%, #7ee84a 50%, #a8f060 100%)',
            borderRadius: '48px',
            padding: '10px 32px 10px 16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          <span style={{ fontSize: '42px', fontWeight: 400, color: 'rgba(255,255,255,0.88)', fontFamily: 'Georgia, serif', letterSpacing: '-2px', marginRight: '16px' }}>
            eB
          </span>
          <div style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.35)', marginRight: '16px', display: 'flex' }} />
          <span style={{ fontSize: '20px', fontWeight: 300, color: 'rgba(255,255,255,0.9)', letterSpacing: '3px' }}>
            EARNBUTTON
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 900,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.1,
            maxWidth: '900px',
            marginBottom: '20px',
          }}
        >
          The smartest savings{' '}
          <span style={{ color: '#00e6b8' }}>account in DeFi.</span>
        </div>

        {/* Subheadline */}
        <div
          style={{
            fontSize: '24px',
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center',
            marginBottom: '48px',
          }}
        >
          Earn 5–9% APY on USDC, ETH, BTC &amp; EUR · Powered by YO Protocol on Base
        </div>

        {/* Vault pills */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { name: 'yoUSD', apy: '8.5%', color: '#00c896' },
            { name: 'yoETH', apy: '6.2%', color: '#627EEA' },
            { name: 'yoBTC', apy: '5.8%', color: '#F7931A' },
            { name: 'yoEUR', apy: '7.1%', color: '#2775CA' },
          ].map((v) => (
            <div
              key={v.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '16px',
                padding: '16px 28px',
                borderTop: `3px solid ${v.color}`,
              }}
            >
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                {v.name}
              </span>
              <span style={{ fontSize: '28px', fontWeight: 800, color: v.color }}>
                {v.apy}
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                APY
              </span>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            display: 'flex',
            gap: '32px',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          <span>🔒 Non-custodial</span>
          <span>✅ Audited</span>
          <span>⚡ Instant exit</span>
          <span>🌐 Base Mainnet</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
