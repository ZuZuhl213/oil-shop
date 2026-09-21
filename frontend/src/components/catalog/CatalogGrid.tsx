import type { Product } from "@/lib/api-types";
import { ProductCard } from "./ProductCard";

export function CatalogGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}
