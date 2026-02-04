import { Suspense } from "react";
import EditorialBrandClient from "./EditorialBrandClient";

interface EditorialPageProps {
  params: { brand: string } | Promise<{ brand: string }>;
}

// Server component — now async to unwrap params
export default async function EditorialPage({ params }: EditorialPageProps) {
  const resolvedParams = await params;
  const { brand } = resolvedParams;

  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading…</div>}>
      <EditorialBrandClient brand={brand} />
    </Suspense>
  );
}
