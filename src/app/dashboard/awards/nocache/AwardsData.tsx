// AwardsData.tsx
import AwardsGridClient from "../AwardsGridClient";
import { Award } from "@/lib/GetAwards";

async function getAwardsData(): Promise<Award[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/awards?cache=false`, {
    next: { revalidate: 0 },
  });

  return res.json();
}

export default async function AwardsData() {
  const awards = await getAwardsData();

  return <AwardsGridClient awards={awards} />;
}