"use client";

import { ExternalLink, GripVertical, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { canonicalUrl, formatDuration, thumbnailUrl } from "@/lib/youtube";
import { useDragReorder } from "@/lib/dnd";
import type { Video } from "@/lib/types";

type Props = {
  videos: Video[];
  activeVideoId: string | null;
  emptyMessage?: string;
  onSelect: (id: string) => void;
  onComplete: (id: string, completed: boolean) => void;
  onRemove: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
};

export function QueuePanel({
  videos,
  activeVideoId,
  emptyMessage,
  onSelect,
  onComplete,
  onRemove,
  onReorder,
}: Props) {
  const dnd = useDragReorder(onReorder);

  return (
    <div className="dotted-bg flex h-full w-full flex-col border-l-2 border-black bg-stone-50 dark:border-zinc-100 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b-2 border-black bg-yellow-300 px-3 py-2 brutal-shadow dark:border-zinc-100 dark:text-black">
        <h2 className="text-sm font-black uppercase tracking-tight">Queue</h2>
        <span className="font-mono text-xs font-bold">
          {videos.length.toString().padStart(2, "0")}
        </span>
      </div>

      <ScrollArea className="flex-1">
        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 px-4 py-12 text-center">
            <p className="text-sm font-bold uppercase">
              {emptyMessage ?? "Empty queue"}
            </p>
            <p className="font-mono text-[10px] uppercase opacity-60">
              Paste a URL above
            </p>
          </div>
        ) : (
          <ul className="flex flex-col" onDragEnd={dnd.onDragEnd}>
            {videos.map((v) => {
              const pct =
                v.durationSeconds > 0
                  ? Math.min(
                      100,
                      Math.max(0, (v.watchedSeconds / v.durationSeconds) * 100)
                    )
                  : 0;
              const active = v.id === activeVideoId;
              const dragging = dnd.draggingId === v.id;
              const dropTarget = dnd.overId === v.id && dnd.draggingId !== v.id;

              return (
                <li
                  key={v.id}
                  draggable
                  onDragStart={(e) => {
                    dnd.onDragStart(v.id)(e);
                    try {
                      e.dataTransfer.setData(
                        "application/x-tubestack-video",
                        v.id
                      );
                    } catch {
                      // ignore
                    }
                  }}
                  onDragOver={dnd.onDragOver(v.id)}
                  onDragLeave={dnd.onDragLeave(v.id)}
                  onDrop={dnd.onDrop(v.id)}
                  className={`group relative border-b-2 border-black bg-white transition-colors hover:bg-stone-100 dark:border-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 ${
                    dragging ? "opacity-40" : ""
                  } ${dropTarget ? "border-t-4 border-t-red-500" : ""}`}
                >
                  {active && !v.completed && (
                    <span
                      className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-red-600"
                      aria-hidden
                    />
                  )}
                  <div className="flex items-start gap-1.5 p-2">
                    <span
                      className="mt-1 flex cursor-grab items-center text-black/40 active:cursor-grabbing dark:text-zinc-400"
                      aria-hidden
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </span>
                    <Checkbox
                      checked={v.completed}
                      onCheckedChange={(c) => onComplete(v.id, c === true)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 border-2 border-black"
                      aria-label="Mark complete"
                    />
                    <button
                      type="button"
                      onClick={() => onSelect(v.id)}
                      className="flex flex-1 gap-2 text-left"
                    >
                      <div className="relative h-12 w-20 shrink-0 overflow-hidden border-2 border-black bg-stone-200 dark:border-zinc-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.thumbnail || thumbnailUrl(v.videoId)}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          draggable={false}
                        />
                        {v.durationSeconds > 0 && (
                          <span className="absolute bottom-0 right-0 bg-black px-1 font-mono text-[9px] font-bold text-white">
                            {formatDuration(v.durationSeconds)}
                          </span>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p
                          className={`line-clamp-2 text-xs leading-tight font-bold ${
                            v.completed ? "text-black/40 line-through" : ""
                          }`}
                        >
                          {v.title}
                        </p>
                        {v.author && (
                          <p className="truncate font-mono text-[10px] uppercase opacity-60">
                            {v.author}
                          </p>
                        )}
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <div className="h-1.5 flex-1 border border-black bg-white dark:border-zinc-100 dark:bg-zinc-800">
                            <div
                              className="h-full bg-red-600 transition-[width] duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="shrink-0 font-mono text-[9px] font-bold tabular-nums">
                            {Math.round(pct)}%
                          </span>
                        </div>
                      </div>
                    </button>
                    <div className="flex flex-col items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <a
                        href={canonicalUrl(v.videoId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Watch on YouTube"
                        className="border-2 border-black p-0.5 hover:bg-red-500 hover:text-white dark:border-zinc-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(v.id);
                        }}
                        aria-label="Remove video"
                        title="Remove"
                        className="border-2 border-black p-0.5 hover:bg-red-500 hover:text-white dark:border-zinc-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
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
