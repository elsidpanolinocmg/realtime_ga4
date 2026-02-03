// AwardsData.tsx
import AwardsGridClient from "../AwardsGridClient";
import { Award } from "@/lib/GetAwards";

async function getAwardsData(): Promise<Award[]> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/awards`, {
        cache: "no-store",
    });

    return res.json();
}

export default async function AwardsData() {
    const awards = await getAwardsData();

    return <AwardsGridClient awards={awards} />;
}