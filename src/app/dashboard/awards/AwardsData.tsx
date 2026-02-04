"use client";

import { useState, useEffect } from "react";
import AwardsGridClient from "./AwardsGridClient";
import { Award } from "@/lib/GetAwards";

export default function AwardsData() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAwards() {
      try {
        const params = new URLSearchParams(window.location.search);
        const refresh = params.get("cache") === "false";

        const res = await fetch(
          `/api/awards${refresh ? "?cache=false" : ""}`,
          { cache: "no-store" }
        );

        const data = await res.json();
        setAwards(data);
      } catch (err) {
        console.error("Failed to fetch awards:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAwards();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl">
        Loading Awards...
      </div>
    );
  }

  return <AwardsGridClient awards={awards} />;
}
