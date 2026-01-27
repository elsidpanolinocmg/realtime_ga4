"use client";

import { useEffect, useRef } from "react";

interface VideoRotatorProps {
  xmlUrl: string;        // XML feed URL
  displayTime?: number; // seconds
  startIndex?: number;
}

export default function VideoRotator({
  xmlUrl,
  displayTime = 30,
  startIndex = 0,
}: VideoRotatorProps) {
  const iframeA = useRef<HTMLIFrameElement>(null);
  const iframeB = useRef<HTMLIFrameElement>(null);
  const titleBox = useRef<HTMLDivElement>(null);

  const videos = useRef<{ title: string; link: string }[]>([]);
  const currentIndex = useRef(startIndex);
  const showingA = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /* ---------------- LOAD RSS (XML) ---------------- */
  useEffect(() => {
    if (!xmlUrl) return;

    fetch(xmlUrl + "?_ts=" + Date.now())
      .then(res => res.text())
      .then(xmlText => {
        const xml = new DOMParser().parseFromString(xmlText, "application/xml");
        const items = xml.querySelectorAll("item");

        videos.current = Array.from(items)
          .map(item => ({
            title: item.querySelector("title")?.textContent?.trim() || "",
            link: item.querySelector("description")?.textContent?.trim() || "",
          }))
          .filter(v => v.link.includes("vimeo.com"));

        if (!videos.current.length) return;

        showInitial();

        intervalRef.current = setInterval(
          nextVideo,
          displayTime * 1000
        );
      })
      .catch(err => console.error("Failed to load XML:", err));

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [xmlUrl, displayTime]);

  /* ---------------- INITIAL DISPLAY ---------------- */
  const showInitial = () => {
    const first = videos.current[currentIndex.current % videos.current.length];
    const next = videos.current[(currentIndex.current + 1) % videos.current.length];

    loadInto(iframeA.current, first.link);
    iframeA.current?.classList.add("active");

    if (titleBox.current) titleBox.current.textContent = first.title;

    loadInto(iframeB.current, next.link);
  };

  /* ---------------- LOAD VIDEO ---------------- */
  const loadInto = (iframe: HTMLIFrameElement | null, link: string) => {
    if (!iframe) return;
    const id = extractVimeoId(link);
    if (!id) return;

    iframe.src = `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&background=1&transparent=1`;
  };

  /* ---------------- ROTATION ---------------- */
  const nextVideo = () => {
    currentIndex.current =
      (currentIndex.current + 1) % videos.current.length;

    const current = videos.current[currentIndex.current];
    const next =
      videos.current[(currentIndex.current + 1) % videos.current.length];

    // Title fade
    if (titleBox.current) {
      titleBox.current.style.opacity = "0";
      setTimeout(() => {
        titleBox.current!.textContent = current.title;
        titleBox.current!.style.opacity = "1";
      }, 200);
    }

    if (showingA.current) {
      iframeB.current?.classList.add("active");
      iframeA.current?.classList.remove("active");
      loadInto(iframeA.current, next.link);
    } else {
      iframeA.current?.classList.add("active");
      iframeB.current?.classList.remove("active");
      loadInto(iframeB.current, next.link);
    }

    showingA.current = !showingA.current;
  };

  /* ---------------- HELPERS ---------------- */
  const extractVimeoId = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : "";
  };

  /* ---------------- UI ---------------- */
  return (
    <>
      {/* INLINE STYLES — SAME AS HTML */}
      <style>{`
        .video-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          height: 100%;
        }

        .video-area {
          position: relative;
          width: 100%;
          max-width: 1920px;
          aspect-ratio: 16 / 9;
          overflow: hidden;
        }

        .video-layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          opacity: 0;
          transition: opacity 1s ease-in-out;
          z-index: 0;
        }

        .video-layer.active {
          opacity: 1;
          z-index: 1;
        }

        .video-title {
          width: 100%;
          max-height: 3em;
          font-size: 24px;
          font-weight: bold;
          color: black;
          text-align: center;
          line-height: 1.5em;
          overflow: hidden;
          word-break: break-word;
          white-space: normal;
          margin-top: 10px;
          transition: opacity 0.3s ease-in-out;
        }
      `}</style>

      <div className="video-wrapper">
        <div className="video-area">
          <iframe
            ref={iframeA}
            className="video-layer"
            allow="autoplay; fullscreen"
          />
          <iframe
            ref={iframeB}
            className="video-layer"
            allow="autoplay; fullscreen"
          />
        </div>

        <div ref={titleBox} className="video-title" />
      </div>
    </>
  );
}
