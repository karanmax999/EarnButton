/**
 * Agent Dashboard Main Route
 * 
 * This route handler serves the main agent dashboard page at `/agent`.
 * It's a simple route that delegates to the page component.
 * 
 * Requirements: 8.1
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * GET handler for the agent dashboard main page
 * 
 * Returns a redirect to the page component or serves the dashboard.
 * In Next.js 13+, page.tsx handles the rendering, so this route
 * is primarily for documentation and future middleware needs.
 * 
 * @param req - The incoming request
 * @returns NextResponse with appropriate status
 */
export async function GET(req: NextRequest) {
  try {
    // The page.tsx component handles the actual rendering
    // This route is here for consistency and future middleware needs
    return NextResponse.json(
      { message: 'Agent Dashboard - Use /agent page route' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[agent-dashboard] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load agent dashboard' },
      { status: 500 }
    )
  }
}
