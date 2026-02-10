import { Suspense } from "react";
import AwardsBrandClient from "./AwardsBrandClient";

interface AwardsBrandPageProps {
  params: { brand: string } | Promise<{ brand: string }>;
}

// Server component — now async to unwrap params
export default async function EditorialPage({ params }: AwardsBrandPageProps) {
  const resolvedParams = await params;
  const { brand } = resolvedParams;

  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white">Loading…</div>}>
      <AwardsBrandClient brand={brand} />
    </Suspense>
  );
}
