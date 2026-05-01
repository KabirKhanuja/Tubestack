"use client";

import { Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDuration, thumbnailUrl } from "@/lib/youtube";
import type { Video } from "@/lib/types";

type Props = {
  videos: Video[];
  activeVideoId: string | null;
  onSelect: (id: string) => void;
  onComplete: (id: string, completed: boolean) => void;
  onRemove: (id: string) => void;
};

export function QueuePanel({
  videos,
  activeVideoId,
  onSelect,
  onComplete,
  onRemove,
}: Props) {
  return (
    <div className="flex h-full w-full flex-col border-l border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/60">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold tracking-tight">Queue</h2>
        <span className="text-xs text-zinc-500">
          {videos.length} {videos.length === 1 ? "video" : "videos"}
        </span>
      </div>

      <ScrollArea className="flex-1">
        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center text-sm text-zinc-500">
            <p>No videos yet.</p>
            <p className="text-xs">Paste a YouTube URL above to add one.</p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {videos.map((v) => {
              const pct =
                v.durationSeconds > 0
                  ? Math.min(
                      100,
                      Math.max(0, (v.watchedSeconds / v.durationSeconds) * 100)
                    )
                  : 0;
              const active = v.id === activeVideoId;
              return (
                <li
                  key={v.id}
                  className={`group relative border-b border-zinc-200 transition-colors dark:border-zinc-800 ${
                    active
                      ? "bg-red-50 dark:bg-red-950/20"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-900/60"
                  }`}
                >
                  <div className="flex items-start gap-3 p-3">
                    <Checkbox
                      checked={v.completed}
                      onCheckedChange={(c) => onComplete(v.id, c === true)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                      aria-label="Mark complete"
                    />
                    <button
                      type="button"
                      onClick={() => onSelect(v.id)}
                      className="flex flex-1 gap-3 text-left"
                    >
                      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.thumbnail || thumbnailUrl(v.videoId)}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        {v.durationSeconds > 0 && (
                          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[10px] font-medium text-white">
                            {formatDuration(v.durationSeconds)}
                          </span>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p
                          className={`line-clamp-2 text-sm leading-snug ${
                            v.completed
                              ? "text-zinc-400 line-through"
                              : active
                              ? "font-medium"
                              : ""
                          }`}
                        >
                          {v.title}
                        </p>
                        {v.author && (
                          <p className="truncate text-xs text-zinc-500">
                            {v.author}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-red-600 transition-[width] duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-[10px] tabular-nums text-zinc-500">
                            {Math.round(pct)}%
                          </span>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(v.id);
                      }}
                      aria-label="Remove video"
                      className="rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-200 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-zinc-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
