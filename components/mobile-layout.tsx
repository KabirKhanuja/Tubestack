"use client";

import { useRef, useState } from "react";
import { ExternalLink, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { AddVideoBar } from "@/components/add-video-bar";
import {
  YouTubePlayer,
  type YouTubePlayerHandle,
} from "@/components/youtube-player";
import { ChaptersPanel } from "@/components/chapters-panel";
import { QueuePanel } from "@/components/queue-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { InfoButton } from "@/components/info-button";
import { AddCategoryModal } from "@/components/add-category-modal";
import { MemoryModal } from "@/components/memory-modal";
import { useConfirm } from "@/components/confirm-modal";
import { CategoryRenamePopover } from "@/components/category-rename-popover";
import { WidgetsBar } from "@/components/widgets/widgets-bar";
import { canonicalUrl } from "@/lib/youtube";
import { CATEGORY_COLORS, type Category, type Video } from "@/lib/types";

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
  onAddCategory: (name: string) => void;
  onRemoveCategory: (id: string, moveToCategoryId: string | null) => void;
  onRenameCategory: (id: string, name: string) => void;
  onClearCategory: (id: string) => void;
  onClearAll: () => void;
  onSelectVideo: (id: string) => void;
  onCompleteVideo: (id: string, completed: boolean) => void;
  onRemoveVideo: (id: string) => void;
  onResetVideo: (id: string) => void;
  onReorderVideos: (fromId: string, toId: string) => void;
  onProgress: (currentSeconds: number, durationSeconds: number) => void;
  onEnded: () => void;
};

export function MobileLayout(props: Props) {
  const totalCount = Object.values(props.counts).reduce((a, b) => a + b, 0);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; rect: DOMRect } | null>(
    null
  );
  const confirm = useConfirm();

  const editingCategory = editing
    ? props.categories.find((c) => c.id === editing.id)
    : null;
  const playerRef = useRef<YouTubePlayerHandle>(null);

  async function handleDeleteCategory(id: string) {
    const cat = props.categories.find((c) => c.id === id);
    if (!cat) return;
    const count = props.counts[id] ?? 0;
    const target = props.categories.find((c) => c.id !== id);

    const message =
      count > 0 && target
        ? `Delete "${cat.name}"? ${count} video${
            count === 1 ? "" : "s"
          } will move to "${target.name}".`
        : `Delete "${cat.name}"?`;

    const ok = await confirm({
      title: "Delete category",
      message,
      confirmText: "Delete",
    });
    if (!ok) return;
    props.onRemoveCategory(id, count > 0 && target ? target.id : null);
  }

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-stone-100 text-black dark:bg-zinc-950 dark:text-zinc-100">
      {/* URL bar with brand */}
      <div className="flex shrink-0 items-center gap-2 border-b-2 border-black bg-yellow-300 p-2 dark:border-zinc-100 dark:text-black">
        <div className="grid h-10 w-10 shrink-0 place-items-center border-2 border-black bg-white dark:border-zinc-100 dark:bg-zinc-900 dark:text-zinc-100">
          <Layers className="h-5 w-5 text-red-600" strokeWidth={2.5} />
        </div>
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
          ref={playerRef}
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

      {/* Manual chapters / timestamps */}
      {props.activeVideo && (
        <div className="shrink-0 border-b-2 border-black bg-stone-50 p-2 dark:border-zinc-100 dark:bg-zinc-950">
          <ChaptersPanel
            key={props.activeVideo.videoId}
            videoId={props.activeVideo.videoId}
            onSeek={(s) => playerRef.current?.seekTo(s)}
          />
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
              onEdit={
                c.removable
                  ? (id, rect) => setEditing({ id, rect })
                  : undefined
              }
              editing={editing?.id === c.id}
              color={c.color}
            />
          ))}
          <button
            type="button"
            onClick={() => setAddCategoryOpen(true)}
            aria-label="Add category"
            className="grid h-7 w-7 shrink-0 place-items-center border-2 border-black bg-yellow-300 text-black hover:bg-yellow-400 active:translate-x-px active:translate-y-px dark:border-zinc-100"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
          </button>
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
          onReset={props.onResetVideo}
          onReorder={props.onReorderVideos}
        />
      </div>

      {/* Widgets bar at bottom of mobile column */}
      <div className="border-t-2 border-black bg-stone-100 p-2 pb-3 dark:border-zinc-100 dark:bg-zinc-950">
        <WidgetsBar />
      </div>

      {/* Floating Memory FAB (bottom-left) */}
      <button
        type="button"
        onClick={() => setMemoryOpen(true)}
        aria-label="Memory"
        title="Memory"
        className="fixed bottom-4 left-4 z-40 grid h-12 w-12 place-items-center rounded-full border-2 border-black bg-white text-black brutal-shadow transition-transform hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px active:shadow-none dark:border-zinc-100 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <Trash2 className="h-5 w-5" strokeWidth={2.5} />
      </button>

      <AddCategoryModal
        open={addCategoryOpen}
        onClose={() => setAddCategoryOpen(false)}
        onSubmit={props.onAddCategory}
      />

      <MemoryModal
        open={memoryOpen}
        categories={props.categories}
        counts={props.counts}
        onClose={() => setMemoryOpen(false)}
        onClearCategory={props.onClearCategory}
        onClearAll={props.onClearAll}
      />

      {editing && editingCategory && (
        <CategoryRenamePopover
          anchor={editing.rect}
          color={editingCategory.color ?? CATEGORY_COLORS[0]}
          name={editingCategory.name}
          onRename={(name) => props.onRenameCategory(editingCategory.id, name)}
          onDelete={() => handleDeleteCategory(editingCategory.id)}
          onClose={() => setEditing(null)}
        />
      )}
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
  onEdit,
  editing,
}: {
  id: string;
  name: string;
  count: number;
  active: boolean;
  color?: string;
  onSelect: (id: string) => void;
  onEdit?: (id: string, rect: DOMRect) => void;
  editing?: boolean;
}) {
  return (
    <div
      className={`relative flex shrink-0 items-stretch border-2 transition-all ${
        active
          ? "border-black bg-black text-white brutal-shadow-sm dark:border-zinc-100 dark:bg-zinc-100 dark:text-black"
          : "border-black bg-white text-black hover:bg-stone-200 dark:border-zinc-100 dark:bg-zinc-900 dark:text-zinc-100"
      }`}
      style={
        !active && color
          ? { backgroundColor: `${color}99`, color: "#000" }
          : undefined
      }
    >
      <button
        type="button"
        onClick={() => onSelect(id)}
        className="px-2.5 py-1 text-xs font-bold uppercase"
      >
        {name}{" "}
        <span className="ml-1 font-mono text-[10px] opacity-70">{count}</span>
      </button>
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(id, e.currentTarget.getBoundingClientRect());
          }}
          aria-label={`Edit ${name}`}
          className={`flex items-center justify-center border-l-2 px-1.5 transition-colors hover:bg-black hover:text-white ${
            editing ? "bg-black text-white" : ""
          } ${
            active
              ? "border-l-white/30 dark:border-l-black/30"
              : "border-l-black dark:border-l-zinc-100"
          }`}
        >
          <Pencil className="h-3 w-3" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
