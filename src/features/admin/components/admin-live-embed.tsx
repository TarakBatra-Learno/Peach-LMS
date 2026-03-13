"use client";

import { useEffect, useRef, useState } from "react";

export function AdminLiveEmbed({
  src,
  title,
  minHeight = 960,
}: {
  src: string;
  title: string;
  minHeight?: number;
}) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState(minHeight);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    let resizeObserver: ResizeObserver | null = null;
    let intervalId: number | null = null;

    const syncHeight = () => {
      try {
        const doc = frame.contentDocument;
        if (!doc) return;
        const nextHeight = Math.max(
          doc.documentElement.scrollHeight,
          doc.body.scrollHeight,
          minHeight
        );
        setHeight(nextHeight);
      } catch {
        setHeight(minHeight);
      }
    };

    const handleLoad = () => {
      syncHeight();
      try {
        const doc = frame.contentDocument;
        if (!doc) return;
        resizeObserver = new ResizeObserver(syncHeight);
        resizeObserver.observe(doc.documentElement);
        resizeObserver.observe(doc.body);
        intervalId = window.setInterval(syncHeight, 1200);
      } catch {
        setHeight(minHeight);
      }
    };

    frame.addEventListener("load", handleLoad);
    if (frame.contentDocument?.readyState === "complete") {
      handleLoad();
    }

    return () => {
      frame.removeEventListener("load", handleLoad);
      resizeObserver?.disconnect();
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [minHeight, src]);

  return (
    <iframe
      key={src}
      ref={frameRef}
      title={title}
      src={src}
      className="w-full rounded-[24px] border border-border bg-white shadow-1"
      style={{ height }}
    />
  );
}
