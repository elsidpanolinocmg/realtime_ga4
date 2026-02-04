import { Suspense } from "react";
import AwardsData from "./AwardsData";
import LoadingPage from "@/src/components/LoadingPage";

export default function AwardsPage() {
  return (
    <div className="min-h-screen max-w-screen overflow-auto bg-white text-gray-900">
      <Suspense fallback={<LoadingPage loadingText="Loading Awards..." />}>
        <AwardsData />
      </Suspense>
    </div>
  );
}