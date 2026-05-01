"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { CategorySidebar } from "@/components/category-sidebar";
import { QueuePanel } from "@/components/queue-panel";
import { AddVideoBar } from "@/components/add-video-bar";
import { YouTubePlayer } from "@/components/youtube-player";
import { ThemeToggle } from "@/components/theme-toggle";
import { Resizer } from "@/components/resizer";
import {
  CategoryPickerModal,
  type PendingVideo,
} from "@/components/category-picker-modal";
import { usePersistentState } from "@/lib/storage";
import { reorder } from "@/lib/dnd";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_LAYOUT,
  type Category,
  type TubestackState,
  type Video,
} from "@/lib/types";
import {
  canonicalUrl,
  extractVideoId,
  fetchOEmbed,
  thumbnailUrl,
} from "@/lib/youtube";

const INITIAL_STATE: TubestackState = {
  categories: DEFAULT_CATEGORIES,
  videos: [],
  activeCategoryId: "__all__",
  activeVideoId: null,
  layout: DEFAULT_LAYOUT,
};

const COMPLETE_THRESHOLD = 0.95;

// Panel width constraints (px)
const SIDEBAR_MIN = 160;
const SIDEBAR_MAX = 400;
const QUEUE_MIN = 200;
const QUEUE_MAX = 480;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ensureDefaults(s: TubestackState): TubestackState {
  const existingIds = new Set(s.categories.map((c) => c.id));
  const merged: Category[] = [
    ...DEFAULT_CATEGORIES.filter((c) => !existingIds.has(c.id)),
    ...s.categories,
  ];
  return {
    ...s,
    categories: merged,
    layout: s.layout ?? DEFAULT_LAYOUT,
  };
}

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `cat-${Date.now()}`
  );
}

export default function Home() {
  const [state, setState, hydrated] = usePersistentState<TubestackState>(
    INITIAL_STATE
  );

  const lastSaveRef = useRef<Record<string, number>>({});

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pendingVideo, setPendingVideo] = useState<PendingVideo | null>(null);

  const merged = useMemo(() => ensureDefaults(state), [state]);
  const { categories, videos, activeCategoryId, activeVideoId, layout } = merged;

  const sidebarWidth = layout.sidebarWidth;
  const queueWidth = layout.queueWidth;

  /* ---------- Resizers ---------- */

  const handleSidebarDrag = useCallback((dx: number) => {
    setState((s) => ({
      ...s,
      layout: {
        ...s.layout,
        sidebarWidth: clamp(
          (s.layout?.sidebarWidth ?? DEFAULT_LAYOUT.sidebarWidth) + dx,
          SIDEBAR_MIN,
          SIDEBAR_MAX
        ),
      },
    }));
  }, [setState]);

  const handleQueueDrag = useCallback((dx: number) => {
    // Right resizer: drag left (negative dx) expands queue
    setState((s) => ({
      ...s,
      layout: {
        ...s.layout,
        queueWidth: clamp(
          (s.layout?.queueWidth ?? DEFAULT_LAYOUT.queueWidth) - dx,
          QUEUE_MIN,
          QUEUE_MAX
        ),
      },
    }));
  }, [setState]);

  /* ---------- Counts ---------- */

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const v of videos) {
      out[v.categoryId] = (out[v.categoryId] ?? 0) + 1;
    }
    return out;
  }, [videos]);

  const filteredVideos = useMemo(() => {
    if (activeCategoryId === "__all__") return videos;
    return videos.filter((v) => v.categoryId === activeCategoryId);
  }, [videos, activeCategoryId]);

  const activeVideo = useMemo(
    () => videos.find((v) => v.id === activeVideoId) ?? null,
    [videos, activeVideoId]
  );

  const activeCategoryName = useMemo(() => {
    if (activeCategoryId === "__all__") return "this view";
    return categories.find((c) => c.id === activeCategoryId)?.name ?? "this category";
  }, [activeCategoryId, categories]);

  /* ---------- Categories ---------- */

  const addCategory = useCallback(
    (name: string) => {
      setState((s) => {
        let id = slug(name);
        const existing = new Set(s.categories.map((c) => c.id));
        let i = 2;
        while (existing.has(id)) id = `${slug(name)}-${i++}`;
        const cat: Category = { id, name, removable: true };
        return {
          ...s,
          categories: [...s.categories, cat],
          activeCategoryId: id,
        };
      });
      toast.success(`Category "${name}" added`);
    },
    [setState]
  );

  const removeCategory = useCallback(
    (id: string, moveToCategoryId: string | null) => {
      setState((s) => {
        const cat = s.categories.find((c) => c.id === id);
        if (!cat || !cat.removable) return s;
        const newCategories = s.categories.filter((c) => c.id !== id);
        const newVideos = moveToCategoryId
          ? s.videos.map((v) =>
              v.categoryId === id ? { ...v, categoryId: moveToCategoryId } : v
            )
          : s.videos.filter((v) => v.categoryId !== id);
        const stillActive = newVideos.some((v) => v.id === s.activeVideoId);
        return {
          ...s,
          categories: newCategories,
          videos: newVideos,
          activeCategoryId:
            s.activeCategoryId === id ? "__all__" : s.activeCategoryId,
          activeVideoId: stillActive ? s.activeVideoId : null,
        };
      });

      const cat = categories.find((c) => c.id === id);
      if (cat) {
        if (moveToCategoryId) {
          const target = categories.find((c) => c.id === moveToCategoryId);
          toast.success(
            `Deleted "${cat.name}", moved videos to "${target?.name ?? "another category"}"`
          );
        } else {
          toast.success(`Deleted "${cat.name}"`);
        }
      }
    },
    [setState, categories]
  );

  const reorderCategories = useCallback(
    (fromId: string, toId: string) => {
      setState((s) => ({
        ...s,
        categories: reorder(s.categories, fromId, toId, (c) => c.id),
      }));
    },
    [setState]
  );

  const selectCategory = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, activeCategoryId: id }));
    },
    [setState]
  );

  const clearCategory = useCallback(
    (categoryId: string) => {
      setState((s) => {
        const newVideos = s.videos.filter((v) => v.categoryId !== categoryId);
        const activeStillExists = newVideos.some(
          (v) => v.id === s.activeVideoId
        );
        return {
          ...s,
          videos: newVideos,
          activeVideoId: activeStillExists ? s.activeVideoId : null,
        };
      });
      const cat = categories.find((c) => c.id === categoryId);
      toast.success(`Cleared "${cat?.name ?? "category"}"`);
    },
    [setState, categories]
  );

  const clearAll = useCallback(() => {
    setState((s) => ({ ...s, videos: [], activeVideoId: null }));
    toast.success("Cleared all videos");
  }, [setState]);

  /* ---------- Videos ---------- */

  const selectVideo = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, activeVideoId: id }));
    },
    [setState]
  );

  const handleAddUrl = useCallback(
    async (url: string) => {
      const videoId = extractVideoId(url);
      if (!videoId) {
        toast.error("Couldn't recognize a YouTube URL");
        return;
      }
      setPickerOpen(true);
      setPickerLoading(true);
      setPendingVideo(null);
      try {
        const data = await fetchOEmbed(videoId);
        setPendingVideo({
          videoId,
          title: data.title || "Untitled video",
          author: data.author_name,
          thumbnail: data.thumbnail_url || thumbnailUrl(videoId),
        });
      } catch {
        setPendingVideo({
          videoId,
          title: "Untitled video",
          thumbnail: thumbnailUrl(videoId),
        });
      } finally {
        setPickerLoading(false);
      }
    },
    []
  );

  const handlePickCategory = useCallback(
    (categoryId: string) => {
      if (!pendingVideo) return;
      const { videoId, title, author, thumbnail } = pendingVideo;

      let duplicate = false;
      setState((s) => {
        if (
          s.videos.some(
            (v) => v.videoId === videoId && v.categoryId === categoryId
          )
        ) {
          duplicate = true;
          return s;
        }
        const newVideo: Video = {
          id: `${videoId}-${Date.now()}`,
          videoId,
          title,
          author,
          thumbnail,
          categoryId,
          durationSeconds: 0,
          watchedSeconds: 0,
          completed: false,
          addedAt: Date.now(),
        };
        return {
          ...s,
          videos: [newVideo, ...s.videos],
          activeVideoId: s.activeVideoId ?? newVideo.id,
        };
      });

      setPickerOpen(false);
      setPendingVideo(null);

      const cat = categories.find((c) => c.id === categoryId);
      if (duplicate) {
        toast.warning(`Already in "${cat?.name ?? "this category"}"`);
      } else {
        toast.success(`Added to "${cat?.name ?? "queue"}"`);
      }
    },
    [pendingVideo, setState, categories]
  );

  const closePicker = useCallback(() => {
    setPickerOpen(false);
    setPendingVideo(null);
  }, []);

  const completeVideo = useCallback(
    (id: string, completed: boolean) => {
      setState((s) => ({
        ...s,
        videos: s.videos.map((v) =>
          v.id === id
            ? {
                ...v,
                completed,
                watchedSeconds: completed
                  ? v.durationSeconds || v.watchedSeconds
                  : v.watchedSeconds,
              }
            : v
        ),
        activeVideoId:
          completed && s.activeVideoId === id ? null : s.activeVideoId,
      }));
    },
    [setState]
  );

  const removeVideo = useCallback(
    (id: string) => {
      const video = videos.find((v) => v.id === id);
      setState((s) => ({
        ...s,
        videos: s.videos.filter((v) => v.id !== id),
        activeVideoId: s.activeVideoId === id ? null : s.activeVideoId,
      }));
      toast.success(`Removed "${video?.title ?? "video"}"`);
    },
    [setState, videos]
  );

  const reorderVideos = useCallback(
    (fromId: string, toId: string) => {
      setState((s) => ({
        ...s,
        videos: reorder(s.videos, fromId, toId, (v) => v.id),
      }));
    },
    [setState]
  );

  /* ---------- Playback ---------- */

  const handleProgress = useCallback(
    (currentSeconds: number, durationSeconds: number) => {
      const id = activeVideoId;
      if (!id) return;

      // auto-complete at 95%+
      if (
        durationSeconds > 0 &&
        currentSeconds / durationSeconds >= COMPLETE_THRESHOLD
      ) {
        setState((s) => {
          const v = s.videos.find((x) => x.id === id);
          if (!v || v.completed) return s;
          return {
            ...s,
            videos: s.videos.map((x) =>
              x.id === id
                ? {
                    ...x,
                    completed: true,
                    watchedSeconds: durationSeconds,
                    durationSeconds,
                  }
                : x
            ),
          };
        });
        return;
      }

      const now = Date.now();
      const last = lastSaveRef.current[id] ?? 0;
      if (now - last < 1500) return;
      lastSaveRef.current[id] = now;

      setState((s) => ({
        ...s,
        videos: s.videos.map((v) =>
          v.id === id
            ? {
                ...v,
                watchedSeconds: Math.max(v.watchedSeconds, currentSeconds),
                durationSeconds:
                  durationSeconds > 0 ? durationSeconds : v.durationSeconds,
              }
            : v
        ),
      }));
    },
    [activeVideoId, setState]
  );

  const handleEnded = useCallback(() => {
    if (!activeVideoId) return;
    setState((s) => ({
      ...s,
      videos: s.videos.map((v) =>
        v.id === activeVideoId
          ? {
              ...v,
              completed: true,
              watchedSeconds: v.durationSeconds || v.watchedSeconds,
            }
          : v
      ),
    }));
  }, [activeVideoId, setState]);

  /* ---------- Keyboard shortcuts ---------- */

  useEffect(() => {
    function isEditable(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      );
    }

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditable(e.target)) return;

      if (e.key === "Escape") {
        if (pickerOpen) return; // dialog handles it
        if (activeVideoId) {
          e.preventDefault();
          setState((s) => ({ ...s, activeVideoId: null }));
        }
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (filteredVideos.length === 0) return;
        e.preventDefault();
        const idx = filteredVideos.findIndex((v) => v.id === activeVideoId);
        let nextIdx: number;
        if (idx === -1) {
          nextIdx = e.key === "ArrowDown" ? 0 : filteredVideos.length - 1;
        } else {
          nextIdx =
            e.key === "ArrowDown"
              ? Math.min(filteredVideos.length - 1, idx + 1)
              : Math.max(0, idx - 1);
        }
        const next = filteredVideos[nextIdx];
        if (next) setState((s) => ({ ...s, activeVideoId: next.id }));
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeVideoId, filteredVideos, pickerOpen, setState]);

  /* ---------- Render ---------- */

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-stone-100 text-black dark:bg-zinc-950 dark:text-zinc-100">
      {/* Left: Categories — resizable */}
      <div
        className="hidden shrink-0 sm:block"
        style={{ width: sidebarWidth }}
      >
        <CategorySidebar
          categories={categories}
          activeId={activeCategoryId}
          counts={counts}
          onSelect={selectCategory}
          onAdd={addCategory}
          onRemove={removeCategory}
          onReorder={reorderCategories}
          onClearCategory={clearCategory}
          onClearAll={clearAll}
        />
      </div>

      {/* Resizer: sidebar ↔ player */}
      <Resizer
        onDrag={handleSidebarDrag}
        ariaLabel="Resize sidebar"
      />

      {/* Middle: Player */}
      <main className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        <div className="flex shrink-0 items-center gap-2">
          <div className="min-w-0 flex-1">
            <AddVideoBar loading={pickerLoading} onSubmit={handleAddUrl} />
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 flex-col items-stretch justify-start gap-2 overflow-hidden">
          <YouTubePlayer
            videoId={hydrated && activeVideo ? activeVideo.videoId : null}
            startSeconds={activeVideo?.watchedSeconds ?? 0}
            onProgress={handleProgress}
            onEnded={handleEnded}
          />

          {activeVideo && (
            <div className="flex items-start justify-between gap-2 border-2 border-black bg-white p-2 dark:border-zinc-100 dark:bg-zinc-900">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-black leading-tight uppercase">
                  {activeVideo.title}
                </h2>
                {activeVideo.author && (
                  <p className="mt-0.5 font-mono text-xs uppercase opacity-60">
                    {activeVideo.author}
                  </p>
                )}
              </div>
              <a
                href={canonicalUrl(activeVideo.videoId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 border-2 border-black px-2 py-1 text-xs font-bold uppercase transition-colors hover:bg-red-500 hover:text-white dark:border-zinc-100 dark:hover:border-red-500"
              >
                <ExternalLink className="h-3 w-3" />
                YouTube
              </a>
            </div>
          )}
        </div>
      </main>

      {/* Resizer: player ↔ queue */}
      <Resizer
        onDrag={handleQueueDrag}
        ariaLabel="Resize queue"
      />

      {/* Right: Queue — resizable */}
      <div
        className="hidden shrink-0 lg:block"
        style={{ width: queueWidth }}
      >
        <QueuePanel
          videos={filteredVideos}
          activeVideoId={activeVideoId}
          emptyMessage={
            videos.length === 0
              ? "No videos yet."
              : `No videos in ${activeCategoryName}.`
          }
          onSelect={selectVideo}
          onComplete={completeVideo}
          onRemove={removeVideo}
          onReorder={reorderVideos}
        />
      </div>

      <CategoryPickerModal
        open={pickerOpen}
        loading={pickerLoading}
        pending={pendingVideo}
        categories={categories}
        onPick={handlePickCategory}
        onClose={closePicker}
      />
    </div>
  );
}
