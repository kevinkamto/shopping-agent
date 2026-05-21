"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Bot, Search, BarChart2, Star } from "lucide-react"
import type { AgentEvent } from "@/types"

const AGENTS = {
  orchestrator: { icon: Bot, label: "Orchestrator", color: "#f59e0b" },
  search: { icon: Search, label: "Search", color: "#60a5fa" },
  analysis: { icon: BarChart2, label: "Analysis", color: "#34d399" },
  recommender: { icon: Star, label: "Recommender", color: "#f472b6" },
} as const

export function AgentStatusStream({ events }: { events: AgentEvent[] }) {
  return (
    <div className="space-y-2">
      <AnimatePresence>
        {events.map((event, i) => {
          const agentConfig = AGENTS[event.agent]
          if (!agentConfig) return null
          const { icon: Icon, label, color } = agentConfig
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm backdrop-blur-sm"
            >
              <div
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1"
                style={{ color, borderColor: color + "40", background: color + "15" }}
              >
                <Icon size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium" style={{ color }}>
                  {label}
                </span>
                <span className="ml-2 text-zinc-400">{event.message}</span>
              </div>
              {event.status === "thinking" && (
                <div className="flex gap-1 items-center mt-1 shrink-0">
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce"
                      style={{ animationDelay: `${j * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
