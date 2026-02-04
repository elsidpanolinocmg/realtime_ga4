"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Stepper from "@/src/components/Stepper";

const ROTATION_OPTIONS = [
  { label: "Pause", value: 0 },
  { label: "30 seconds", value: 30_000 },
  { label: "1 minute", value: 60_000 },
  { label: "1 min 30 sec", value: 90_000 },
  { label: "2 minutes", value: 120_000 },
  { label: "3 minutes", value: 180_000 },
  { label: "4 minutes", value: 240_000 },
  { label: "5 minutes", value: 300_000 },
];

const DEFAULTS = {
  rotation: 60_000,
  stripspeed: 100,
  cardduration: 4000,
  activeNowIntervalms: 10_000,
  activeTodayIntervalms: 60_000,
  videoDisplayTime: 30,
  fullscreen: false,
};

interface BrandSettingsClientProps {
  brand?: string;
  siteConfig?: any;
  currentParams?: Record<string, string>;
  onClose?: () => void;
  onSave?: (params: Record<string, string>) => void;
}

export default function BrandSettingsClient({
  brand,
  siteConfig,
  currentParams,
  onClose,
  onSave,
}: BrandSettingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rotation, setRotation] = useState(DEFAULTS.rotation);
  const [stripSpeed, setStripSpeed] = useState(DEFAULTS.stripspeed);
  const [cardDurationSec, setCardDurationSec] = useState(DEFAULTS.cardduration / 1000);
  const [activeNowSec, setActiveNowSec] = useState(DEFAULTS.activeNowIntervalms / 1000);
  const [activeTodaySec, setActiveTodaySec] = useState(DEFAULTS.activeTodayIntervalms / 1000);
  const [videoDuration, setVideoDuration] = useState(DEFAULTS.videoDisplayTime);
  const [fullscreen, setFullscreen] = useState(DEFAULTS.fullscreen);

  /* ---------------- Initialize from URL ---------------- */
  useEffect(() => {
    const r = searchParams.get("rotation");
    if (r) setRotation(Number(r));

    const s = searchParams.get("stripspeed");
    if (s) setStripSpeed(Number(s));

    const c = searchParams.get("cardduration");
    if (c) setCardDurationSec(Math.round(Number(c) / 1000));

    const an = searchParams.get("activeNowIntervalms");
    if (an) setActiveNowSec(Math.round(Number(an) / 1000));

    const at = searchParams.get("activeTodayIntervalms");
    if (at) setActiveTodaySec(Math.round(Number(at) / 1000));

    const vdt = searchParams.get("videoDisplayTime");
    if (vdt) setVideoDuration(Number(vdt));

    const fs = searchParams.get("fullscreen");
    if (fs) setFullscreen(fs === "1");
  }, [searchParams]);

  const handleSave = () => {
    const params: Record<string, string> = {};

    if (rotation !== DEFAULTS.rotation) params.rotation = String(rotation);
    if (stripSpeed !== DEFAULTS.stripspeed) params.stripspeed = String(stripSpeed);
    if (cardDurationSec * 1000 !== DEFAULTS.cardduration) params.cardduration = String(cardDurationSec * 1000);
    if (activeNowSec * 1000 !== DEFAULTS.activeNowIntervalms) params.activeNowIntervalms = String(activeNowSec * 1000);
    if (activeTodaySec * 1000 !== DEFAULTS.activeTodayIntervalms) params.activeTodayIntervalms = String(activeTodaySec * 1000);
    if (videoDuration !== DEFAULTS.videoDisplayTime) params.videoDisplayTime = String(videoDuration);
    if (fullscreen) params.fullscreen = "1";

    if (onSave) {
      onSave(params);
    } else {
      const queryString = new URLSearchParams(params).toString();
      router.push(`/dashboard/editorial/${brand ?? ""}?${queryString}`);
    }

    if (onClose) onClose();
  };

  const handleRestoreDefaults = () => {
    setRotation(DEFAULTS.rotation);
    setStripSpeed(DEFAULTS.stripspeed);
    setCardDurationSec(DEFAULTS.cardduration / 1000);
    setActiveNowSec(DEFAULTS.activeNowIntervalms / 1000);
    setActiveTodaySec(DEFAULTS.activeTodayIntervalms / 1000);
    setVideoDuration(DEFAULTS.videoDisplayTime);
    setFullscreen(DEFAULTS.fullscreen);
  };

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 text-gray-900">
      <div className="w-full max-w-lg bg-white rounded-lg shadow p-6 space-y-6">
        <h1 className="text-xl font-bold">Editorial Dashboard Settings</h1>

        <div>
          <label className="block text-sm font-medium mb-1">Page Rotation Interval</label>
          <select
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
          >
            {ROTATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <Stepper label="Exclusives Duration" value={cardDurationSec} min={2} max={120} step={1} suffix="sec" onChange={setCardDurationSec} />
        <Stepper label="Latest News Speed" value={stripSpeed} min={10} max={1000} step={10} onChange={setStripSpeed} />
        <Stepper label="Active Today Refresh" value={activeTodaySec} min={10} max={120} step={10} suffix="sec" onChange={setActiveTodaySec} />
        <Stepper label="Active Now Refresh" value={activeNowSec} min={5} max={120} step={5} suffix="sec" onChange={setActiveNowSec} />
        <Stepper label="Video Duration" value={videoDuration} min={5} max={60} step={5} suffix="sec" onChange={setVideoDuration} />

        <div className="flex items-center gap-2">
          <input id="fullscreen" type="checkbox" checked={fullscreen} onChange={(e) => setFullscreen(e.target.checked)} className="h-5 w-5 accent-black" />
          <label htmlFor="fullscreen" className="text-sm">Auto fullscreen</label>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={handleRestoreDefaults} className="px-4 py-2 rounded border bg-gray-200 hover:bg-gray-300">Restore Defaults</button>
          <button onClick={handleSave} className="px-4 py-2 rounded bg-black text-white">Save & Open Dashboard</button>
        </div>
      </div>
    </div>
  );
}
