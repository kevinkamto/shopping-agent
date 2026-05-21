export interface Product {
  title: string
  price: string
  url: string
  pros: string[]
  cons: string[]
  score: number
  reasoning: string
}

export interface ShoppingResponse {
  query: string
  products: Product[]
  summary: string
  search_queries_used: string[]
  agent_trace: string[]
}

export type AgentKey = "orchestrator" | "search" | "analysis" | "recommender"
export type AgentStatus = "thinking" | "done" | "error"

export interface AgentEvent {
  agent: AgentKey
  status: AgentStatus
  message: string
  timestamp: number
}

export interface ShoppingRequest {
  query: string
  budget?: number
  currency?: string
  max_results?: number
}
