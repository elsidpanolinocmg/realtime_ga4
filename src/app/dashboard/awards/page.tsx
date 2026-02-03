import AwardsGridClient from "./AwardsGridClient";
import { getAwards, Award } from "@/lib/GetAwards";

export default async function AwardsPage() {
  const awards: Award[] = await getAwards();

  return (
    <div className="h-screen w-screen overflow-auto bg-white text-gray-900">
      <AwardsGridClient awards={awards} />
    </div>
  );
}
