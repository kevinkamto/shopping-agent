"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, Search, BarChart2, Star, ChevronDown, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import type { AgentEvent, AgentStatus } from "@/types"

const AGENTS = {
  orchestrator: { icon: Bot,       label: "Orchestrator", color: "#f59e0b" },
  search:       { icon: Search,    label: "Search",       color: "#60a5fa" },
  analysis:     { icon: BarChart2, label: "Analysis",     color: "#34d399" },
  recommender:  { icon: Star,      label: "Recommender",  color: "#f472b6" },
} as const

function StatusIcon({ status }: { status: AgentStatus }) {
  if (status === "done")
    return <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />
  if (status === "error")
    return <XCircle size={13} className="shrink-0 text-red-400" />
  return <Loader2 size={13} className="shrink-0 animate-spin text-zinc-500" />
}

interface AgentStatusStreamProps {
  events: AgentEvent[]
  loading: boolean
}

export function AgentStatusStream({ events, loading }: AgentStatusStreamProps) {
  const [collapsed, setCollapsed] = useState(false)

  // auto-expand when a new search starts
  useEffect(() => {
    if (events.length === 0) setCollapsed(false)
  }, [events.length])

  if (!loading && events.length === 0) return null

  const doneCount = events.filter((e) => e.status === "done").length
  const summaryText =
    loading && events.length === 0
      ? "Starting…"
      : loading
        ? `${doneCount} of ${events.length} steps done`
        : `${doneCount} steps completed`

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-zinc-800/50"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Agent Activity
          </span>
          {loading && <Loader2 size={11} className="animate-spin text-zinc-600" />}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600">{summaryText}</span>
          <motion.div
            animate={{ rotate: collapsed ? -90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={14} className="text-zinc-500" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-zinc-800/60 border-t border-zinc-800">
              {events.length === 0 && (
                <div className="flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-500">
                  <Loader2 size={12} className="animate-spin" />
                  Initialising agents…
                </div>
              )}

              <AnimatePresence>
                {events.map((event, i) => {
                  const cfg = AGENTS[event.agent]
                  if (!cfg) return null
                  const { icon: Icon, label, color } = cfg
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <div
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: color + "18", color }}
                      >
                        <Icon size={10} />
                      </div>

                      <span className="w-24 shrink-0 text-xs font-medium" style={{ color }}>
                        {label}
                      </span>

                      <span className="min-w-0 flex-1 truncate text-xs text-zinc-400">
                        {event.message}
                      </span>

                      <StatusIcon status={event.status} />
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
