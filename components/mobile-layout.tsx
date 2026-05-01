"use client";

import { ExternalLink } from "lucide-react";
import { AddVideoBar } from "@/components/add-video-bar";
import { YouTubePlayer } from "@/components/youtube-player";
import { QueuePanel } from "@/components/queue-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { InfoButton } from "@/components/info-button";
import { canonicalUrl } from "@/lib/youtube";
import type { Category, Video } from "@/lib/types";

type Props = {
  hydrated: boolean;
  categories: Category[];
  counts: Record<string, number>;
  activeCategoryId: string;
  videos: Video[];
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
  onReorderVideos: (fromId: string, toId: string) => void;
  onProgress: (currentSeconds: number, durationSeconds: number) => void;
  onEnded: () => void;
};

export function MobileLayout(props: Props) {
  const totalCount = Object.values(props.counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-stone-100 text-black dark:bg-zinc-950 dark:text-zinc-100">
      {/* URL bar */}
      <div className="flex shrink-0 items-center gap-2 border-b-2 border-black bg-yellow-300 p-2 dark:border-zinc-100 dark:text-black">
        <div className="min-w-0 flex-1">
          <AddVideoBar
            loading={props.pickerLoading}
            onSubmit={props.onAddUrl}
          />
        </div>
        <InfoButton />
        <ThemeToggle />
      </div>

      {/* Player */}
      <div className="shrink-0">
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
      </div>

      {/* Active video info + Watch on YouTube */}
      {props.activeVideo && (
        <div className="flex shrink-0 items-start justify-between gap-2 border-b-2 border-black bg-white p-2 dark:border-zinc-100 dark:bg-zinc-900">
          <div className="min-w-0 flex-1">
            <h2 className="line-clamp-2 text-sm font-black leading-tight uppercase">
              {props.activeVideo.title}
            </h2>
            {props.activeVideo.author && (
              <p className="mt-0.5 truncate font-mono text-[10px] uppercase opacity-60">
                {props.activeVideo.author}
              </p>
            )}
          </div>
          <a
            href={canonicalUrl(props.activeVideo.videoId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 border-2 border-black px-2 py-1 text-[10px] font-bold uppercase hover:bg-red-500 hover:text-white dark:border-zinc-100"
          >
            <ExternalLink className="h-3 w-3" />
            YouTube
          </a>
        </div>
      )}

      {/* Horizontal category tabs */}
      <div
        className="shrink-0 overflow-x-auto border-b-2 border-black bg-stone-50 dark:border-zinc-100 dark:bg-zinc-900"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex w-max gap-1.5 p-1.5">
          <CatTab
            id="__all__"
            name="All"
            count={totalCount}
            active={props.activeCategoryId === "__all__"}
            onSelect={props.onSelectCategory}
          />
          {props.categories.map((c) => (
            <CatTab
              key={c.id}
              id={c.id}
              name={c.name}
              count={props.counts[c.id] ?? 0}
              active={props.activeCategoryId === c.id}
              onSelect={props.onSelectCategory}
              color={c.color}
            />
          ))}
        </div>
      </div>

      {/* Queue list */}
      <div className="min-h-0 flex-1">
        <QueuePanel
          videos={props.filteredVideos}
          activeVideoId={props.activeVideoId}
          emptyMessage={props.emptyMessage}
          onSelect={props.onSelectVideo}
          onComplete={props.onCompleteVideo}
          onRemove={props.onRemoveVideo}
          onReorder={props.onReorderVideos}
        />
      </div>
    </div>
  );
}

function CatTab({
  id,
  name,
  count,
  active,
  color,
  onSelect,
}: {
  id: string;
  name: string;
  count: number;
  active: boolean;
  color?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`shrink-0 border-2 px-2.5 py-1 text-xs font-bold uppercase transition-all ${
        active
          ? "border-black bg-black text-white brutal-shadow-sm dark:border-zinc-100 dark:bg-zinc-100 dark:text-black"
          : "border-black bg-white text-black hover:bg-stone-200 dark:border-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      }`}
      style={
        !active && color
          ? { backgroundColor: `${color}99`, color: "#000" }
          : undefined
      }
    >
      {name}{" "}
      <span className="ml-1 font-mono text-[10px] opacity-70">{count}</span>
    </button>
  );
}
