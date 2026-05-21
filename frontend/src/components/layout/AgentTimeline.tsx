import { Bot, Search, BarChart2, Star } from "lucide-react"
import type { AgentEvent } from "@/types"

const AGENTS = {
  orchestrator: { icon: Bot, label: "Orchestrator", color: "#f59e0b" },
  search: { icon: Search, label: "Search", color: "#60a5fa" },
  analysis: { icon: BarChart2, label: "Analysis", color: "#34d399" },
  recommender: { icon: Star, label: "Recommender", color: "#f472b6" },
} as const

export function AgentTimeline({ events }: { events: AgentEvent[] }) {
  const agentKeys = Object.keys(AGENTS) as Array<keyof typeof AGENTS>
  const lastEventByAgent = agentKeys.reduce(
    (acc, key) => {
      const agentEvents = events.filter((e) => e.agent === key)
      if (agentEvents.length > 0) {
        acc[key] = agentEvents[agentEvents.length - 1]
      }
      return acc
    },
    {} as Partial<Record<keyof typeof AGENTS, AgentEvent>>,
  )

  return (
    <div className="flex items-center gap-3">
      {agentKeys.map((key) => {
        const { icon: Icon, label, color } = AGENTS[key]
        const event = lastEventByAgent[key]
        return (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full ring-1"
              style={{
                color,
                borderColor: color + (event ? "80" : "20"),
                background: color + (event ? "20" : "08"),
              }}
            >
              <Icon size={12} />
            </div>
            <span
              className="hidden text-xs sm:block"
              style={{ color: event ? color : "#52525b" }}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
