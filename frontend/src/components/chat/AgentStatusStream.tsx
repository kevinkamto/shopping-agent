"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bot, Search, BarChart2, Star,
  ChevronDown, CheckCircle2, XCircle, Loader2,
} from "lucide-react"
import type { AgentEvent, AgentKey, AgentStatus } from "@/types"

// ── constants ────────────────────────────────────────────────────────────────

const SUB_AGENTS: AgentKey[] = ["search", "analysis", "recommender"]

const AGENT_META = {
  orchestrator: { icon: Bot,       label: "Orchestrator", color: "#f59e0b" },
  search:       { icon: Search,    label: "Search",       color: "#60a5fa" },
  analysis:     { icon: BarChart2, label: "Analysis",     color: "#34d399" },
  recommender:  { icon: Star,      label: "Recommender",  color: "#f472b6" },
} as const

// ── shared primitives ────────────────────────────────────────────────────────

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
    <span className="flex items-center gap-1 text-xs font-medium text-zinc-500">
      <Loader2 size={11} className="animate-spin" /> Running
    </span>
  )
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function LogLine({ event }: { event: AgentEvent }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      className="flex items-start gap-3 font-mono text-xs"
    >
      <span className="shrink-0 text-zinc-600">{formatTime(event.timestamp)}</span>
      <span className="text-zinc-400">{event.message}</span>
    </motion.div>
  )
}

// ── sub-agent panel (search / analysis / recommender) ───────────────────────

interface SubAgentPanelProps {
  agentKey: Exclude<AgentKey, "orchestrator">
  events: AgentEvent[]
}

function SubAgentPanel({ agentKey, events }: SubAgentPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { icon: Icon, label, color } = AGENT_META[agentKey]
  const latestStatus = events[events.length - 1]?.status ?? "running"

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950"
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-zinc-800/40"
      >
        {/* colored left accent */}
        <div
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
          style={{ background: color + "18", color }}
        >
          <Icon size={10} />
        </div>

        <span className="flex-1 text-xs font-semibold" style={{ color }}>
          {label}
        </span>

        <StatusBadge status={latestStatus} />

        <motion.div animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown size={12} className="text-zinc-600" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="log"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-1 border-t border-zinc-800/60 px-3 py-2">
              <AnimatePresence>
                {events.map((e, i) => <LogLine key={i} event={e} />)}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── orchestrator panel (top-level container) ─────────────────────────────────

interface OrchestratorPanelProps {
  orchestratorEvents: AgentEvent[]
  byAgent: Record<AgentKey, AgentEvent[]>
  loading: boolean
}

function OrchestratorPanel({ orchestratorEvents, byAgent, loading }: OrchestratorPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const latestStatus = orchestratorEvents[orchestratorEvents.length - 1]?.status ?? "running"
  const activeSubAgents = SUB_AGENTS.filter((k) => byAgent[k].length > 0)

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/80 backdrop-blur-sm">
      {/* orchestrator header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-800/50"
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ background: "#f59e0b18", color: "#f59e0b" }}
        >
          <Bot size={14} />
        </div>

        <div className="flex-1">
          <span className="text-sm font-semibold text-amber-400">Orchestrator</span>
          <span className="ml-2 text-xs text-zinc-500">coordinates all agents</span>
        </div>

        {loading && latestStatus !== "done" && (
          <Loader2 size={12} className="animate-spin text-zinc-600" />
        )}

        <StatusBadge status={latestStatus} />

        <motion.div animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-zinc-500" />
        </motion.div>
      </button>

      {/* collapsible body */}
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
            <div className="border-t border-zinc-800">
              {/* orchestrator's own log */}
              {orchestratorEvents.length > 0 && (
                <div className="space-y-1 px-4 py-2.5">
                  <AnimatePresence>
                    {orchestratorEvents.map((e, i) => <LogLine key={i} event={e} />)}
                  </AnimatePresence>
                </div>
              )}

              {/* sub-agent panels, nested */}
              {(activeSubAgents.length > 0 || loading) && (
                <div className="space-y-2 border-t border-zinc-800/60 px-3 pb-3 pt-2.5">
                  <p className="px-1 text-[10px] font-medium uppercase tracking-widest text-zinc-600">
                    Sub-agents
                  </p>
                  <AnimatePresence>
                    {activeSubAgents.map((key) => (
                      <SubAgentPanel
                        key={key}
                        agentKey={key as Exclude<AgentKey, "orchestrator">}
                        events={byAgent[key]}
                      />
                    ))}
                  </AnimatePresence>

                  {loading && activeSubAgents.length === 0 && (
                    <div className="flex items-center gap-2 px-1 text-xs text-zinc-600">
                      <Loader2 size={11} className="animate-spin" />
                      Waiting for first agent…
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── root export ───────────────────────────────────────────────────────────────

interface AgentStatusStreamProps {
  events: AgentEvent[]
  loading: boolean
}

export function AgentStatusStream({ events, loading }: AgentStatusStreamProps) {
  const [searchId, setSearchId] = useState(0)
  useEffect(() => {
    if (events.length === 0 && loading) setSearchId((n) => n + 1)
  }, [events.length, loading])

  if (!loading && events.length === 0) return null

  const byAgent = Object.fromEntries(
    (["orchestrator", ...SUB_AGENTS] as AgentKey[]).map((k) => [
      k,
      events.filter((e) => e.agent === k),
    ])
  ) as Record<AgentKey, AgentEvent[]>

  return (
    <OrchestratorPanel
      key={searchId}
      orchestratorEvents={byAgent.orchestrator}
      byAgent={byAgent}
      loading={loading}
    />
  )
}
