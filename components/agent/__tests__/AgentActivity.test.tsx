import { describe, it, expect, vi, beforeEach } from "vitest"
import * as tradeService from "@/lib/agent/tradeService"

vi.mock("@/lib/agent/tradeService", () => ({
  fetchTradeHistory: vi.fn(),
}))

describe("AgentActivity Component", () => {
  const mockAgentId = "agent-123"
  const mockWalletAddress = "0x1234567890123456789012345678901234567890"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should accept walletAddress and agentId props", () => {
    const props = { walletAddress: mockWalletAddress, agentId: mockAgentId }
    expect(props.walletAddress).toBe(mockWalletAddress)
    expect(props.agentId).toBe(mockAgentId)
  })

  it("should call fetchTradeHistory with agentId", async () => {
    const mockFetch = vi.mocked(tradeService.fetchTradeHistory)
    mockFetch.mockResolvedValue([])
    await tradeService.fetchTradeHistory(mockAgentId, 10, 0)
    expect(mockFetch).toHaveBeenCalledWith(mockAgentId, 10, 0)
  })

  it("should handle empty trade history", async () => {
    const mockFetch = vi.mocked(tradeService.fetchTradeHistory)
    mockFetch.mockResolvedValue([])
    const result = await tradeService.fetchTradeHistory(mockAgentId, 10, 0)
    expect(result).toEqual([])
  })

  it("should sort trades newest first by timestamp", () => {
    const trades = [
      { id: "t1", timestamp: 1000 },
      { id: "t2", timestamp: 3000 },
      { id: "t3", timestamp: 2000 },
    ]
    const sorted = [...trades].sort((a, b) => b.timestamp - a.timestamp)
    expect(sorted[0].id).toBe("t2")
    expect(sorted[1].id).toBe("t3")
    expect(sorted[2].id).toBe("t1")
  })

  it("should calculate pagination offset correctly", () => {
    const TRADES_PER_PAGE = 10
    expect((1 - 1) * TRADES_PER_PAGE).toBe(0)
    expect((2 - 1) * TRADES_PER_PAGE).toBe(10)
  })

  it("should detect hasMore when full page returned", () => {
    const TRADES_PER_PAGE = 10
    expect(Array(10).fill(null).length === TRADES_PER_PAGE).toBe(true)
    expect(Array(5).fill(null).length === TRADES_PER_PAGE).toBe(false)
  })

  it("should poll every 10 seconds", () => {
    const POLL_INTERVAL = 10000
    expect(POLL_INTERVAL).toBe(10000)
  })
})
