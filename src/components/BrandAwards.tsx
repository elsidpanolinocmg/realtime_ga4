// src/components/BrandDashboard.tsx
"use client";

import Image from "next/image";
import TickerStrip from "./TickerStrip";
import TickerCard from "./TickerCard";
import VideoRotator from "./VideoRotator";
import { useState, useEffect } from "react";

interface BrandDashboardProps {
  brand: string;
  siteConfig: any;
  stripspeed?: number;
  cardduration?: number;
  activeNowIntervalms?: number;
  activeTodayIntervalms?: number;
  videoDurationTime?: number;

}

export default function BrandDashboard({
  brand,
  siteConfig,
  stripspeed = 100,
  cardduration = 4000,
  videoDurationTime = 30
}: BrandDashboardProps) {
  const safeReplace = (url: string) => (url ? url.replace(/\/$/, "") : "");

  const feedUrl =
    siteConfig?.exclusivesUrl ??
    safeReplace(siteConfig?.url) + "/news-feed.xml";
  const exclusiveFeedUrl =
    siteConfig?.exclusiveFeed ??
    safeReplace(siteConfig?.url) + "/exclusive-news-feed.xml";
  const videosFeedUrl =
    siteConfig?.videosFeed ??
    safeReplace(siteConfig?.url) + "/latest-videos.xml";

  const [showVideoRotator, setShowVideoRotator] = useState(true);

  useEffect(() => {
    if (!videosFeedUrl) setShowVideoRotator(false);
  }, [videosFeedUrl]);

  const toggleFullscreen = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="bg-white flex flex-col min-h-screen md:h-screen">
      {/* ================= HEADER ================= */}
      <header className="flex flex-col md:flex-row items-center gap-4 md:gap-6 px-3 py-4 shrink-0 overflow-x-auto md:overflow-x-visible">
        {/* Left logo */}
        <div className="flex justify-between w-full md:w-fit">
          {siteConfig?.image && (
            <div className="relative h-14 w-40 md:h-24 md:w-64">
              <Image
                src={`/${siteConfig.image}`}
                alt={siteConfig.name}
                fill
                className="object-contain"
                priority
              />
            </div>
          )}

          <div
            onClick={toggleFullscreen}
            className="relative h-12 w-20 md:h-24 md:w-32 cursor-pointer block md:hidden"
            title="Toggle fullscreen"
          >
            <Image
              src="/logo/cmg.png"
              alt="Charlton Media Group"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* CMG fullscreen toggle */}
        <div className="flex w-fit">
          <div
            onClick={toggleFullscreen}
            className="relative h-12 w-20 md:h-24 md:w-32 cursor-pointer hidden md:block"
            title="Toggle fullscreen"
          >
            <Image
              src="/logo/cmg.png"
              alt="Charlton Media Group"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col md:flex-row items-stretch justify-center px-3 md:px-8 py-4 gap-8 pb-[100px]">
        <div className="w-full max-w-[1920px] flex flex-col md:flex-row gap-8 px-3 md:px-8">

          {showVideoRotator && (
            <div className="w-full md:w-[clamp(40%,100vh,80%)] flex flex-col h-full overflow-hidden">
              <VideoRotator
                xmlUrl={videosFeedUrl}
                displayTime={videoDurationTime}
                onError={() => setShowVideoRotator(false)}
              />
            </div>
          )}

        </div>
      </main>

      {/* ================= TICKERS ================= */}
      <footer className="fixed bottom-0 left-0 z-50 w-full md:static">
        <div className="flex flex-col md:space-y-0 gap-0">
          <div className="flex-1 min-w-0">
            <TickerCard
              feedUrl={exclusiveFeedUrl}
              duration={cardduration}
            />
          </div>
          <div className="flex-1 min-w-0">
            <TickerStrip
              feedUrl={feedUrl}
              speed={stripspeed}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
