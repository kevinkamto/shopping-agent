import Link from "next/link"
import { Bot, ArrowLeft } from "lucide-react"

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex items-center gap-2">
          <Bot className="text-amber-500" size={20} />
          <span className="font-display font-semibold tracking-tight">ShopAgent</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-zinc-500">Agents ready</span>
      </div>
    </header>
  )
}
