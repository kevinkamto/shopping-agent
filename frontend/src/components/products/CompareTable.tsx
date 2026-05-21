import { ExternalLink } from "lucide-react"
import type { Product } from "@/types"

export function CompareTable({ products }: { products: Product[] }) {
  if (products.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900">
            <th className="px-4 py-3 text-left font-medium text-zinc-400">Product</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-400">Price</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-400">Score</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-400">Top Pro</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-400">Top Con</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr
              key={p.url || i}
              className="border-b border-zinc-800 last:border-0 hover:bg-zinc-900/50 transition-colors"
            >
              <td className="px-4 py-3 text-zinc-100 font-medium max-w-[200px] truncate">
                {p.title}
              </td>
              <td className="px-4 py-3 font-mono text-amber-400 whitespace-nowrap">{p.price}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${Math.round(p.score * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-400">{Math.round(p.score * 100)}%</span>
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-400 max-w-[160px] truncate">
                {p.pros[0] ?? "—"}
              </td>
              <td className="px-4 py-3 text-zinc-400 max-w-[160px] truncate">
                {p.cons[0] ?? "—"}
              </td>
              <td className="px-4 py-3">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-zinc-500 hover:text-amber-400 transition-colors"
                >
                  <ExternalLink size={13} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
