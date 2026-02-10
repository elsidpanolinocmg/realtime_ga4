"use client";

import { useEffect, useRef } from "react";

export default function WakeLockProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");

          wakeLockRef.current.addEventListener("release", () => {
            console.log("Wake Lock released");
          });

          console.log("Wake Lock active");
        }
      } catch (err) {
        console.warn("Wake Lock error:", err);
      }
    };

    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      wakeLockRef.current?.release?.();
    };
  }, []);

  return <>{children}</>;
}
