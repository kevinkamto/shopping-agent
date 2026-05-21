"use client"

import { useState, type FormEvent } from "react"
import { Search, Loader2 } from "lucide-react"

interface ChatInputProps {
  onSearch: (query: string, budget?: number) => void
  loading: boolean
}

export function ChatInput({ onSearch, loading }: ChatInputProps) {
  const [query, setQuery] = useState("")
  const [budget, setBudget] = useState("")

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!query.trim() || loading) return
    onSearch(query.trim(), budget ? parseFloat(budget) : undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
          size={16}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What are you looking for? e.g. wireless headphones under $200"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3.5 pl-11 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20"
          disabled={loading}
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Budget (optional)"
            min={0}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2.5 pl-7 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-amber-500/60"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Searching…
            </>
          ) : (
            <>
              <Search size={14} />
              Search
            </>
          )}
        </button>
      </div>
    </form>
  )
}
