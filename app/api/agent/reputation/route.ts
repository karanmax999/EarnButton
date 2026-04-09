/**
 * Reputation Data API Route
 * 
 * GET /api/agent/reputation
 * 
 * Handles reputation data retrieval from the ERC-8004 registry.
 * Queries the on-chain reputation registry for an agent and returns
 * reputation metrics including Sharpe ratio, drawdown, and validation score.
 * 
 * Requirements: 5.1, 11.4
 */

import { NextRequest, NextResponse } from 'next/server'
import { ReputationResponse } from '@/types/agent'

/**
 * GET handler for reputation data
 * 
 * Query parameters:
 * - agentId: string (required) - The unique identifier of the agent
 * 
 * Response:
 * {
 *   sharpeRatio: number
 *   drawdownPercentage: number
 *   validationScore: number
 *   updatedAt: number
 * }
 * 
 * @param req - The incoming request
 * @returns NextResponse with ReputationResponse
 */
export async function GET(req: NextRequest): Promise<NextResponse<ReputationResponse>> {
  try {
    // Extract query parameters
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agentId')

    // Validate agentId parameter
    if (!agentId || typeof agentId !== 'string') {
      return NextResponse.json(
        {
          sharpeRatio: 0,
          drawdownPercentage: 0,
          validationScore: 0,
          updatedAt: 0,
        },
        { status: 400 }
      )
    }

    if (agentId.length === 0 || agentId.length > 256) {
      return NextResponse.json(
        {
          sharpeRatio: 0,
          drawdownPercentage: 0,
          validationScore: 0,
          updatedAt: 0,
        },
        { status: 400 }
      )
    }

    // In a real implementation, this would:
    // 1. Query the ERC-8004 Reputation Registry contract
    // 2. Fetch the agent's reputation metrics
    // 3. Return the metrics with the current timestamp

    // For now, we simulate the response with realistic values
    const sharpeRatio = Math.random() * 2 // 0-2
    const drawdownPercentage = Math.random() * 50 // 0-50%
    const validationScore = Math.random() * 100 // 0-100%
    const updatedAt = Date.now()

    return NextResponse.json(
      {
        sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
        drawdownPercentage: parseFloat(drawdownPercentage.toFixed(2)),
        validationScore: parseFloat(validationScore.toFixed(2)),
        updatedAt,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[agent-reputation] Error:', error)
    return NextResponse.json(
      {
        sharpeRatio: 0,
        drawdownPercentage: 0,
        validationScore: 0,
        updatedAt: 0,
      },
      { status: 500 }
    )
  }
}
