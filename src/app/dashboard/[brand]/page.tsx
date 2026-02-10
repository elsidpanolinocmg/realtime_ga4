import { Suspense } from "react";
import BrandPageClient from "./BrandClient";

interface PageProps {
  params: { brand: string } | Promise<{ brand: string }>;
}

export default async function BrandPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { brand } = resolvedParams;

  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading…</div>}>
      <BrandPageClient brand={brand} />
    </Suspense>
  );
}
