"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bot, Search, BarChart2, Star,
  ChevronDown, CheckCircle2, XCircle, Loader2,
} from "lucide-react"
import type { AgentEvent, AgentKey, AgentStatus } from "@/types"

const AGENT_ORDER: AgentKey[] = ["orchestrator", "search", "analysis", "recommender"]

const AGENT_META = {
  orchestrator: { icon: Bot,       label: "Orchestrator", color: "#f59e0b" },
  search:       { icon: Search,    label: "Search",       color: "#60a5fa" },
  analysis:     { icon: BarChart2, label: "Analysis",     color: "#34d399" },
  recommender:  { icon: Star,      label: "Recommender",  color: "#f472b6" },
} as const

function StatusBadge({ status }: { status: AgentStatus }) {
  if (status === "done")
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
        <CheckCircle2 size={11} /> Done
      </span>
    )
  if (status === "error")
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-400">
        <XCircle size={11} /> Error
      </span>
    )
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-zinc-400">
      <Loader2 size={11} className="animate-spin" /> Running
    </span>
  )
}

function formatTime(ms: number) {
  const d = new Date(ms)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

interface AgentPanelProps {
  agentKey: AgentKey
  events: AgentEvent[]
}

function AgentPanel({ agentKey, events }: AgentPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const meta = AGENT_META[agentKey]
  const { icon: Icon, label, color } = meta
  const latestStatus = events[events.length - 1]?.status ?? "running"

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/70"
    >
      {/* panel header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-zinc-800/50"
      >
        {/* agent icon */}
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
          style={{ background: color + "18", color }}
        >
          <Icon size={12} />
        </div>

        {/* label */}
        <span className="flex-1 text-xs font-semibold" style={{ color }}>
          {label}
        </span>

        {/* status badge */}
        <StatusBadge status={latestStatus} />

        {/* chevron */}
        <motion.div
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={{ duration: 0.18 }}
          className="ml-1"
        >
          <ChevronDown size={13} className="text-zinc-600" />
        </motion.div>
      </button>

      {/* collapsible log */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="log"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-800 px-4 py-2 font-mono space-y-1">
              <AnimatePresence>
                {events.map((e, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-start gap-3 text-xs"
                  >
                    <span className="shrink-0 text-zinc-600">{formatTime(e.timestamp)}</span>
                    <span className="text-zinc-400">{e.message}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface AgentStatusStreamProps {
  events: AgentEvent[]
  loading: boolean
}

export function AgentStatusStream({ events, loading }: AgentStatusStreamProps) {
  // reset panel collapse state when a new search begins
  const [searchId, setSearchId] = useState(0)
  useEffect(() => {
    if (events.length === 0 && loading) setSearchId((n) => n + 1)
  }, [events.length, loading])

  if (!loading && events.length === 0) return null

  // group events by agent, preserving pipeline order
  const byAgent = Object.fromEntries(
    AGENT_ORDER.map((key) => [key, events.filter((e) => e.agent === key)])
  ) as Record<AgentKey, AgentEvent[]>

  const activeAgents = AGENT_ORDER.filter((key) => byAgent[key].length > 0)

  return (
    <div className="space-y-2">
      {loading && activeAgents.length === 0 && (
        <div className="flex items-center gap-2 px-1 text-xs text-zinc-500">
          <Loader2 size={12} className="animate-spin" />
          Initialising agents…
        </div>
      )}

      <AnimatePresence>
        {activeAgents.map((key) => (
          <AgentPanel key={`${searchId}-${key}`} agentKey={key} events={byAgent[key]} />
        ))}
      </AnimatePresence>
    </div>
  )
}
