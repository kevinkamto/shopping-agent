import type { ShoppingRequest, ShoppingResponse } from "@/types"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export async function searchProducts(req: ShoppingRequest): Promise<ShoppingResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Search failed (${response.status}): ${text}`)
  }

  return response.json() as Promise<ShoppingResponse>
}

export function createSearchStream(req: ShoppingRequest): EventSource {
  const params = new URLSearchParams({ _body: JSON.stringify(req) })
  return new EventSource(`${BASE_URL}/api/v1/search/stream?${params.toString()}`)
}
