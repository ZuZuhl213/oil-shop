import { Suspense } from "react";
import { LoadingState, ProductsView } from "@/components/catalog/ProductsView";

export default function ProductsPage() {
  return <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-16"><LoadingState /></main>}><ProductsView /></Suspense>;
}
