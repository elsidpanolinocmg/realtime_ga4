"use client";

import { useEffect, useState } from "react";

interface OdometerProps {
  fetchUrl?: string;
  field?: string;
  fontSize?: string;
  bold?: boolean;
  color?: string;
  backgroundColor?: string;
}

const OdometerDaily = ({
  fetchUrl = "/api/active-30-days",
  field = "activeLast30Days",
  fontSize = "3rem",
  bold = false,
  color = "#010101",
  backgroundColor = "#ffffff00",
}: OdometerProps) => {
  const [value, setValue] = useState<number>(0);

  const fetchValue = async () => {
    try {
      const res = await fetch(fetchUrl);
      const data = await res.json();
      if (typeof data[field] === "number") {
        setValue(data[field]);
      }
    } catch (err) {
      console.error("Failed to fetch value:", err);
    }
  };

  useEffect(() => {
    // Fetch immediately on mount
    fetchValue();

    // Calculate milliseconds until next 12:00
    const now = new Date();
    const nextNoon = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      12,
      0,
      0,
      0
    );

    if (now >= nextNoon) {
      // If it's past noon, schedule for tomorrow
      nextNoon.setDate(nextNoon.getDate() + 1);
    }

    const timeToWait = nextNoon.getTime() - now.getTime();

    const timer = setTimeout(() => {
      fetchValue();

      // Schedule daily fetch every 24 hours
      setInterval(fetchValue, 24 * 60 * 60 * 1000);
    }, timeToWait);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        fontSize,
        fontWeight: bold ? "bold" : "normal",
        color,
        backgroundColor,
        lineHeight: 1,
      }}
    >
      {value.toLocaleString()} {/* automatically adds commas for thousands */}
    </div>
  );
};

export default OdometerDaily;
