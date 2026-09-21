import { Suspense } from "react";
import { LoadingState, ProductsView } from "@/components/catalog/ProductsView";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-16"><LoadingState /></main>}><ProductsView fixedCategory={slug} /></Suspense>;
}
