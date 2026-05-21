"use client"

import { useState, useCallback } from "react"
import type { AgentEvent, ShoppingResponse } from "@/types"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export function useShoppingStream() {
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [result, setResult] = useState<ShoppingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string, budget?: number) => {
    setEvents([])
    setResult(null)
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`${BASE_URL}/api/v1/search/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, budget, currency: "USD", max_results: 5 }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`Request failed: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          try {
            const parsed = JSON.parse(raw) as {
              type: string
              event?: AgentEvent
              result?: ShoppingResponse
            }

            if (parsed.type === "agent_event" && parsed.event) {
              setEvents((prev) => [...prev, parsed.event!])
            } else if (parsed.type === "result" && parsed.result) {
              setResult(parsed.result)
              setLoading(false)
            }
          } catch {
            // malformed SSE line — skip
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  return { search, events, result, loading, error }
}
