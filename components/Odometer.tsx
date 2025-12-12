"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface OdometerProps {
  fetchUrl?: string;
  fontSize?: string;
  bold?: boolean;
  color?: string;
  backgroundColor?: string;
  intervalms?: number;
}

const Odometer: React.FC<OdometerProps> = ({
  fetchUrl = "/api/active-now",
  fontSize = "3rem",
  bold = false,
  color = "#010101",
  backgroundColor = "#ffffff00",
  intervalms = 60000,
}) => {
  const [targetValue, setTargetValue] = useState(0); // target from API
  const [displayValue, setDisplayValue] = useState(0); // value shown on screen
  const [initialFetched, setInitialFetched] = useState(false); // track first fetch

  // Fetch API periodically
  useEffect(() => {
    const fetchValue = async () => {
      try {
        // Add intervalms as query parameter
        const res = await fetch(`${fetchUrl}?intervalms=${intervalms}`);
        const data = await res.json();
        if (data.activeUsers !== undefined) {
          setTargetValue(data.activeUsers);
          // For the first fetch, show value immediately
          if (!initialFetched) {
            setDisplayValue(data.activeUsers);
            setInitialFetched(true);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchValue();
    const interval = setInterval(fetchValue, intervalms);
    return () => clearInterval(interval);
  }, [fetchUrl, intervalms, initialFetched]);

  // Animate displayValue to targetValue after first fetch
  useEffect(() => {
    if (!initialFetched) return; // do not animate before first fetch
    if (displayValue === targetValue) return;

    const step = displayValue < targetValue ? 1 : -1;
    const interval = setInterval(() => {
      setDisplayValue((prev) => {
        if (prev === targetValue) {
          clearInterval(interval);
          return prev;
        }
        return prev + step;
      });
    }, 30); // speed of rolling

    return () => clearInterval(interval);
  }, [targetValue, displayValue, initialFetched]);

  // Prepare string with padding
  const str = displayValue.toString();
  const maxLen = Math.max(str.length, targetValue.toString().length);
  const paddedStr = str.padStart(maxLen, "0");

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        fontSize,
        fontWeight: bold ? "bold" : "normal",
        color,
        backgroundColor: backgroundColor,
        lineHeight: 1,
      }}
    >
      {paddedStr.split("").map((digit, i) => (
        <span
          key={i}
          style={{
            display: "inline-flex",
            alignItems: "flex-start",
            justifyContent: "center",
            width: "1ch",
            height: fontSize,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <AnimatePresence initial={false}>
            <motion.span
              key={digit + i}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: initialFetched ? 0.15 : 0, ease: "easeInOut" }}
              style={{ position: "absolute", top: 0, left: 0, right: 0 }}
            >
              {digit}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </div>
  );
};

export default Odometer;
