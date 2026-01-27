"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface OdometerProps {
  fetchUrl?: string;
  field?: string;
  fontSize?: string;
  bold?: boolean;
  color?: string;
  backgroundColor?: string;
  intervalms?: number;
}

const OdometerLast = ({
  fetchUrl = "/api/active-today",
  field = "activeToday",
  fontSize = "3rem",
  bold = false,
  color = "#010101",
  backgroundColor = "#ffffff00",
  intervalms = 600000,
}: OdometerProps) => {
  const [targetValue, setTargetValue] = useState(0);
  const [displayValue, setDisplayValue] = useState(0);
  const [initialFetched, setInitialFetched] = useState(false);

  // Fetch latest value
  useEffect(() => {
    const fetchValue = async () => {
      const res = await fetch(`${fetchUrl}?intervalms=${intervalms}`);
      const data = await res.json();

      if (typeof data[field] === "number") {
        setTargetValue(data[field]);
        if (!initialFetched) {
          setDisplayValue(data[field]); // Set without animation
          setInitialFetched(true);
        }
      }
    };

    fetchValue();
    const timer = setInterval(fetchValue, intervalms);
    return () => clearInterval(timer);
  }, [fetchUrl, intervalms, initialFetched, field]);

  // Animate only after initial fetch
  useEffect(() => {
    if (!initialFetched || displayValue === targetValue) return;

    const step = displayValue < targetValue ? 1 : -1;
    const timer = setInterval(() => {
      setDisplayValue((v) => (v === targetValue ? v : v + step));
    }, 30);

    return () => clearInterval(timer);
  }, [displayValue, targetValue, initialFetched]);

  const formattedValue = displayValue.toLocaleString();

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
      {formattedValue.split("").map((char, i) => (
        <span
          key={i}
          style={{
            position: "relative",
            width: char === "," ? "0.5ch" : "1ch",
            height: fontSize,
            overflow: "hidden",
            display: "inline-block",
          }}
        >
          <AnimatePresence initial={false}>
            <motion.span
              key={char + i}
              initial={initialFetched ? { y: "100%", opacity: 0 } : false} // <--- don't animate first time
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {char}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </div>
  );
};

export default OdometerLast;
