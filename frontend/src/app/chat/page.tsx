"use client"

import { Header } from "@/components/layout/Header"
import { ChatInput } from "@/components/chat/ChatInput"
import { AgentStatusStream } from "@/components/chat/AgentStatusStream"
import { ProductGrid } from "@/components/products/ProductGrid"
import { useShoppingStream } from "@/hooks/useShoppingStream"

export default function ChatPage() {
  const { search, events, result, loading } = useShoppingStream()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-8 max-w-5xl mx-auto w-full">
        <ChatInput onSearch={search} loading={loading} />

        {(events.length > 0 || loading) && (
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Agent Activity
            </h2>
            <AgentStatusStream events={events} />
          </section>
        )}

        {result && (
          <section>
            {result.summary && (
              <p className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 text-sm text-zinc-300">
                {result.summary}
              </p>
            )}
            <ProductGrid products={result.products} />
          </section>
        )}

        {!loading && !result && events.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center py-24">
            <p className="text-zinc-500 text-sm">
              Describe what you&apos;d like to buy above and the agents will get to work.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
