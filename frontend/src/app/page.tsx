import Link from "next/link"
import { ArrowRight, Bot, Search, BarChart2, Star } from "lucide-react"

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Bot className="text-amber-500" size={22} />
          <span className="font-display font-semibold text-lg tracking-tight">ShopAgent</span>
        </div>
        <Link
          href="/chat"
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400"
        >
          Start Shopping <ArrowRight size={14} />
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          Powered by GPT-4o + Tavily
        </div>

        <h1 className="font-display max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-zinc-100 sm:text-6xl">
          Your Personal{" "}
          <span className="text-amber-400">AI Shopping</span>{" "}
          Assistant
        </h1>

        <p className="mt-6 max-w-xl text-lg text-zinc-400">
          Describe what you want to buy. A network of specialized AI agents will research, compare,
          and recommend the best products — in real time.
        </p>

        <Link
          href="/chat"
          className="mt-10 flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3.5 text-base font-semibold text-black transition hover:bg-amber-400"
        >
          Find Products Now <ArrowRight size={16} />
        </Link>
      </section>

      <section className="border-t border-zinc-800 px-8 py-16">
        <h2 className="mb-12 text-center font-display text-2xl font-semibold text-zinc-100">
          How It Works
        </h2>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Bot,
              color: "#f59e0b",
              title: "Orchestrator",
              desc: "Decomposes your query into targeted tasks and coordinates the agent pipeline.",
            },
            {
              icon: Search,
              color: "#60a5fa",
              title: "Search Agent",
              desc: "Fires multiple real-time Tavily searches to find fresh product data.",
            },
            {
              icon: BarChart2,
              color: "#34d399",
              title: "Analysis Agent",
              desc: "Extracts specs, pricing, pros & cons from raw search results.",
            },
            {
              icon: Star,
              color: "#f472b6",
              title: "Recommender",
              desc: "Ranks products and generates clear, justified recommendations.",
            },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: color + "20", color }}
              >
                <Icon size={18} />
              </div>
              <h3 className="mb-2 font-semibold text-zinc-100">{title}</h3>
              <p className="text-sm text-zinc-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
