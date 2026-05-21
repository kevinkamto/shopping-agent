import { ProductCard } from "./ProductCard"
import type { Product } from "@/types"

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="text-center text-sm text-zinc-500 py-8">
        No products found. Try a different query.
      </p>
    )
  }

  return (
    <div>
      <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
        {products.length} Product{products.length !== 1 ? "s" : ""} Found
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, i) => (
          <ProductCard key={product.url || i} product={product} rank={i + 1} />
        ))}
      </div>
    </div>
  )
}
