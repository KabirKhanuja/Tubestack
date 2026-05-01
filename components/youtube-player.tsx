"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement | string, opts: YTPlayerOptions) => YTPlayer;
      PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YTPlayer = {
  loadVideoById: (id: string) => void;
  cueVideoById: (id: string) => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
};

type YTPlayerOptions = {
  videoId?: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (e: { target: YTPlayer }) => void;
    onStateChange?: (e: { data: number; target: YTPlayer }) => void;
  };
};

const API_SRC = "https://www.youtube.com/iframe_api";

let apiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve) => {
    const existing = document.querySelector(
      `script[src="${API_SRC}"]`
    ) as HTMLScriptElement | null;

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    if (!existing) {
      const tag = document.createElement("script");
      tag.src = API_SRC;
      tag.async = true;
      document.head.appendChild(tag);
    }
  });

  return apiPromise;
}

export type YouTubePlayerProps = {
  videoId: string | null;
  startSeconds?: number;
  onProgress: (currentSeconds: number, durationSeconds: number) => void;
  onEnded?: () => void;
};

export function YouTubePlayer({
  videoId,
  startSeconds = 0,
  onProgress,
  onEnded,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onProgressRef = useRef(onProgress);
  const onEndedRef = useRef(onEnded);
  const startSecondsRef = useRef(startSeconds);
  const currentVideoRef = useRef<string | null>(null);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);
  useEffect(() => {
    startSecondsRef.current = startSeconds;
  }, [startSeconds]);

  // Initialize the player once
  useEffect(() => {
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        width: "100%",
        height: "100%",
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            readyRef.current = true;
            if (videoId) {
              currentVideoRef.current = videoId;
              playerRef.current?.loadVideoById(videoId);
              if (startSecondsRef.current > 0) {
                setTimeout(() => {
                  playerRef.current?.seekTo(startSecondsRef.current, true);
                }, 250);
              }
            }
          },
          onStateChange: (e) => {
            const state = e.data;
            const PLAYING = window.YT?.PlayerState.PLAYING ?? 1;
            const ENDED = window.YT?.PlayerState.ENDED ?? 0;

            if (state === PLAYING) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = setInterval(() => {
                const p = playerRef.current;
                if (!p) return;
                try {
                  onProgressRef.current(p.getCurrentTime(), p.getDuration());
                } catch {
                  // ignore
                }
              }, 1000);
            } else {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              // capture position on pause/buffer/cued
              const p = playerRef.current;
              if (p) {
                try {
                  onProgressRef.current(p.getCurrentTime(), p.getDuration());
                } catch {
                  // ignore
                }
              }
            }

            if (state === ENDED) {
              onEndedRef.current?.();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
      playerRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to videoId changes
  useEffect(() => {
    if (!readyRef.current || !playerRef.current) return;
    if (videoId && videoId !== currentVideoRef.current) {
      currentVideoRef.current = videoId;
      playerRef.current.loadVideoById(videoId);
      if (startSecondsRef.current > 0) {
        setTimeout(() => {
          try {
            playerRef.current?.seekTo(startSecondsRef.current, true);
          } catch {
            // ignore
          }
        }, 300);
      }
    }
  }, [videoId]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-video shadow-lg ring-1 ring-white/10">
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      <div
        aria-hidden={Boolean(videoId)}
        className={`pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-zinc-400 transition-opacity duration-200 ${
          videoId ? "opacity-0" : "opacity-100"
        }`}
      >
        Select a video from the queue to start watching
      </div>
    </div>
  );
}
