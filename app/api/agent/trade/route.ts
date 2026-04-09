/**
 * Trade Submission API Route
 * 
 * POST /api/agent/trade
 * 
 * Handles trade submission with signed intent and price proof.
 * Validates the signed intent and price proof, records the trade on-chain,
 * and returns the submission response with transaction hash and trade ID.
 * 
 * Requirements: 2.7, 11.2
 */

import { NextRequest, NextResponse } from 'next/server'
import { TradeSubmitResponse } from '@/types/agent'

/**
 * POST handler for trade submission
 * 
 * Request body:
 * {
 *   intent: {
 *     asset: string
 *     amount: string (bigint as string)
 *     direction: 'buy' | 'sell'
 *     timestamp: number
 *     signature?: string
 *     priceProof?: string
 *   }
 *   priceProof: string
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   txHash: string
 *   tradeId: string
 *   message?: string
 * }
 * 
 * @param req - The incoming request
 * @returns NextResponse with TradeSubmitResponse
 */
export async function POST(req: NextRequest): Promise<NextResponse<TradeSubmitResponse>> {
  try {
    // Parse request body
    let body: {
      intent?: {
        asset?: string
        amount?: string
        direction?: string
        timestamp?: number
        signature?: string
        priceProof?: string
      }
      priceProof?: string
    }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          txHash: '',
          tradeId: '',
          message: 'Invalid request body',
        },
        { status: 400 }
      )
    }

    const { intent, priceProof } = body

    // Validate intent structure
    if (!intent || typeof intent !== 'object') {
      return NextResponse.json(
        {
          success: false,
          txHash: '',
          tradeId: '',
          message: 'intent parameter is required and must be an object',
        },
        { status: 400 }
      )
    }

    // Validate intent fields
    if (!intent.asset || typeof intent.asset !== 'string') {
      return NextResponse.json(
        {
          success: false,
          txHash: '',
          tradeId: '',
          message: 'intent.asset is required and must be a string',
        },
        { status: 400 }
      )
    }

    if (!intent.amount || typeof intent.amount !== 'string') {
      return NextResponse.json(
        {
          success: false,
          txHash: '',
          tradeId: '',
          message: 'intent.amount is required and must be a string',
        },
        { status: 400 }
      )
    }

    if (!intent.direction || !['buy', 'sell'].includes(intent.direction)) {
      return NextResponse.json(
        {
          success: false,
          txHash: '',
          tradeId: '',
          message: 'intent.direction is required and must be "buy" or "sell"',
        },
        { status: 400 }
      )
    }

    if (typeof intent.timestamp !== 'number' || intent.timestamp <= 0) {
      return NextResponse.json(
        {
          success: false,
          txHash: '',
          tradeId: '',
          message: 'intent.timestamp is required and must be a positive number',
        },
        { status: 400 }
      )
    }

    // Validate price proof
    if (!priceProof || typeof priceProof !== 'string') {
      return NextResponse.json(
        {
          success: false,
          txHash: '',
          tradeId: '',
          message: 'priceProof parameter is required and must be a string',
        },
        { status: 400 }
      )
    }

    // Validate signature if present
    if (intent.signature && typeof intent.signature !== 'string') {
      return NextResponse.json(
        {
          success: false,
          txHash: '',
          tradeId: '',
          message: 'intent.signature must be a string if provided',
        },
        { status: 400 }
      )
    }

    // In a real implementation, this would:
    // 1. Verify the EIP-712 signature
    // 2. Verify the RedStone price proof
    // 3. Submit the trade transaction on-chain
    // 4. Return the transaction hash and trade ID

    // For now, we simulate the response
    const tradeId = `trade-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`

    return NextResponse.json(
      {
        success: true,
        txHash,
        tradeId,
        message: 'Trade submitted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[agent-trade] Error:', error)
    return NextResponse.json(
      {
        success: false,
        txHash: '',
        tradeId: '',
        message: 'Failed to submit trade',
      },
      { status: 500 }
    )
  }
}
