import { ExternalLink, ThumbsUp, ThumbsDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/types"

export function ProductCard({ product, rank }: { product: Product; rank: number }) {
  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-amber-500/50 hover:bg-zinc-800/80">
      {rank === 1 && (
        <Badge className="absolute -top-2.5 left-4 bg-amber-500 text-black text-xs font-semibold">
          ★ Top Pick
        </Badge>
      )}
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-semibold text-zinc-100 leading-snug line-clamp-2">{product.title}</h3>
        <span className="shrink-0 font-mono text-amber-400 font-medium">{product.price}</span>
      </div>
      <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{product.reasoning}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-emerald-400">
            <ThumbsUp size={10} /> Pros
          </p>
          <ul className="space-y-1">
            {product.pros.slice(0, 3).map((p) => (
              <li key={p} className="text-xs text-zinc-400">
                • {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-red-400">
            <ThumbsDown size={10} /> Cons
          </p>
          <ul className="space-y-1">
            {product.cons.slice(0, 3).map((c) => (
              <li key={c} className="text-xs text-zinc-400">
                • {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 py-2 text-sm text-zinc-300 transition hover:border-amber-500 hover:text-amber-400"
      >
        View Product <ExternalLink size={13} />
      </a>
    </div>
  )
}
