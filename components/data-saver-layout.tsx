"use client";

import { useState } from "react";
import { Feather } from "lucide-react";
import { FAB_CLASS } from "@/components/fab";
import { YouTubePlayer } from "@/components/youtube-player";
import { canonicalUrl } from "@/lib/youtube";
import type { Category, Video } from "@/lib/types";

/**
 * Bare-bones view: player + plain text queue. No thumbnails, widgets,
 * chapters, drag-and-drop, shadows or background patterns — only what's
 * needed to pick and watch videos, to keep memory and data usage low.
 */

type Props = {
  hydrated: boolean;
  categories: Category[];
  counts: Record<string, number>;
  totalCount: number;
  activeCategoryId: string;
  filteredVideos: Video[];
  activeVideo: Video | null;
  activeVideoId: string | null;
  emptyMessage: string;
  pickerLoading: boolean;
  onAddUrl: (url: string) => Promise<void> | void;
  onSelectCategory: (id: string) => void;
  onSelectVideo: (id: string) => void;
  onCompleteVideo: (id: string, completed: boolean) => void;
  onRemoveVideo: (id: string) => void;
  onProgress: (currentSeconds: number, durationSeconds: number) => void;
  onEnded: () => void;
  onExit: () => void;
};

export function DataSaverLayout(props: Props) {
  const [url, setUrl] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = url.trim();
    if (!value || props.pickerLoading) return;
    setUrl("");
    await props.onAddUrl(value);
  }

  return (
    <div
      className="flex h-dvh w-full flex-col overflow-hidden bg-white text-black dark:bg-black dark:text-zinc-100"
      style={{ fontFamily: "system-ui, sans-serif", fontWeight: 400 }}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-zinc-300 p-2 text-sm dark:border-zinc-700">
        <form onSubmit={submit} className="flex min-w-0 flex-1 basis-48">
          <input
            type="url"
            inputMode="url"
            placeholder="Paste a YouTube URL → Enter"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={props.pickerLoading}
            className="h-8 w-full min-w-0 border border-zinc-400 bg-transparent px-2 dark:border-zinc-600"
          />
        </form>
        <select
          value={props.activeCategoryId}
          onChange={(e) => props.onSelectCategory(e.target.value)}
          aria-label="Category"
          className="h-8 border border-zinc-400 bg-transparent px-1 dark:border-zinc-600 dark:bg-black"
        >
          <option value="__all__">All ({props.totalCount})</option>
          {props.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({props.counts[c.id] ?? 0})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={props.onExit}
          className="h-8 border border-zinc-400 px-2 dark:border-zinc-600"
        >
          Normal view
        </button>
      </div>

      {/* Capped width: a smaller player makes YouTube pick a lower quality. */}
      <div className="mx-auto w-full max-w-[640px] shrink-0">
        <YouTubePlayer
          videoId={
            props.hydrated && props.activeVideo
              ? props.activeVideo.videoId
              : null
          }
          startSeconds={props.activeVideo?.watchedSeconds ?? 0}
          onProgress={props.onProgress}
          onEnded={props.onEnded}
        />
        {props.activeVideo && (
          <p className="truncate px-2 py-1 text-sm">
            {props.activeVideo.title}
            {" · "}
            <a
              href={canonicalUrl(props.activeVideo.videoId)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              YouTube
            </a>
          </p>
        )}
      </div>

      <ol className="mx-auto min-h-0 w-full max-w-[640px] flex-1 overflow-y-auto border-t border-zinc-300 text-sm dark:border-zinc-700">
        {props.filteredVideos.length === 0 ? (
          <li className="p-3 opacity-60">{props.emptyMessage}</li>
        ) : (
          props.filteredVideos.map((v) => {
            const active = v.id === props.activeVideoId;
            const pct =
              v.durationSeconds > 0
                ? Math.min(100, Math.round((v.watchedSeconds / v.durationSeconds) * 100))
                : 0;
            return (
              <li
                key={v.id}
                className={`flex items-center gap-2 border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-800 ${
                  active ? "bg-zinc-100 dark:bg-zinc-900" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={v.completed}
                  onChange={(e) => props.onCompleteVideo(v.id, e.target.checked)}
                  aria-label="Mark complete"
                />
                <button
                  type="button"
                  onClick={() => props.onSelectVideo(v.id)}
                  className={`min-w-0 flex-1 truncate text-left ${
                    active ? "font-bold" : ""
                  } ${v.completed ? "line-through opacity-50" : ""}`}
                >
                  {v.title}
                </button>
                <span className="shrink-0 tabular-nums opacity-60">{pct}%</span>
                <button
                  type="button"
                  onClick={() => props.onRemoveVideo(v.id)}
                  aria-label="Remove video"
                  title="Remove"
                  className="shrink-0 px-1 opacity-60 hover:opacity-100"
                >
                  ×
                </button>
              </li>
            );
          })
        )}
      </ol>
    </div>
  );
}

export function DataSaverButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Data saver mode"
      title="Data saver mode"
      className={FAB_CLASS}
    >
      <Feather className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}
