import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a helpful DeFi savings advisor for EarnButton, powered by YO Protocol. You help users understand which YO vault to choose based on their needs.

Available vaults:
- yoUSD: 8.5% APY, deposit USDC, lowest risk, best for stablecoin savings
- yoETH: 6.2% APY, deposit WETH, medium risk, earn yield on ETH holdings
- yoBTC: 5.8% APY, deposit cbBTC, medium risk, earn yield on Bitcoin
- yoEUR: 7.1% APY, deposit EURC, low risk, Euro stablecoin yield

Key facts:
- Non-custodial: users always control their funds
- No lock-ups: withdraw anytime
- Powered by YO Protocol which deploys to Aave, Compound, Morpho
- Running on Base mainnet (low gas fees)
- Not financial advice

Keep responses concise (2-3 sentences max). Be friendly and clear. Never make specific return guarantees.`

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[ai-advisor] ANTHROPIC_API_KEY is not set')
    return NextResponse.json({ error: 'AI advisor not configured' }, { status: 503 })
  }
  console.log('[ai-advisor] API key present, length:', apiKey.length)

  let body: { messages?: Array<{ role: string; content: string }> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const messages = body.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 })
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Anthropic API error:', err)
      return NextResponse.json({ error: 'AI service error' }, { status: 502 })
    }

    const data = await res.json()
    const text = data?.content?.[0]?.text ?? ''
    return NextResponse.json({ text })
  } catch (e) {
    console.error('AI advisor fetch error:', e)
    return NextResponse.json({ error: 'Failed to reach AI service' }, { status: 502 })
  }
}
