"use client";

import { useCallback, useMemo, useRef } from "react";
import { CategorySidebar } from "@/components/category-sidebar";
import { QueuePanel } from "@/components/queue-panel";
import { AddVideoBar } from "@/components/add-video-bar";
import { YouTubePlayer } from "@/components/youtube-player";
import { usePersistentState } from "@/lib/storage";
import {
  DEFAULT_CATEGORIES,
  type Category,
  type TubestackState,
  type Video,
} from "@/lib/types";
import { extractVideoId, fetchOEmbed, thumbnailUrl } from "@/lib/youtube";

const INITIAL_STATE: TubestackState = {
  categories: DEFAULT_CATEGORIES,
  videos: [],
  activeCategoryId: "__all__",
  activeVideoId: null,
};

function ensureDefaults(s: TubestackState): TubestackState {
  // Make sure default categories always exist (don't allow them to be removed)
  const existingIds = new Set(s.categories.map((c) => c.id));
  const merged: Category[] = [
    ...DEFAULT_CATEGORIES.filter((c) => !existingIds.has(c.id)),
    ...s.categories,
  ];
  return { ...s, categories: merged };
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

  // Last persisted progress timestamp (per video) to throttle writes a bit.
  const lastSaveRef = useRef<Record<string, number>>({});

  const merged = useMemo(() => ensureDefaults(state), [state]);
  const { categories, videos, activeCategoryId, activeVideoId } = merged;

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const v of videos) {
      out[v.categoryId] = (out[v.categoryId] ?? 0) + 1;
    }
    return out;
  }, [videos]);

  const filteredVideos = useMemo(() => {
    const list =
      activeCategoryId === "__all__"
        ? videos
        : videos.filter((v) => v.categoryId === activeCategoryId);
    return [...list].sort((a, b) => {
      // Incomplete first, then by addedAt desc
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return b.addedAt - a.addedAt;
    });
  }, [videos, activeCategoryId]);

  const activeVideo = useMemo(
    () => videos.find((v) => v.id === activeVideoId) ?? null,
    [videos, activeVideoId]
  );

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
    },
    [setState]
  );

  const removeCategory = useCallback(
    (id: string) => {
      setState((s) => {
        const cat = s.categories.find((c) => c.id === id);
        if (!cat || !cat.removable) return s;
        const fallback = "__all__";
        return {
          ...s,
          categories: s.categories.filter((c) => c.id !== id),
          videos: s.videos.filter((v) => v.categoryId !== id),
          activeCategoryId:
            s.activeCategoryId === id ? fallback : s.activeCategoryId,
          activeVideoId:
            s.videos.find((v) => v.id === s.activeVideoId)?.categoryId === id
              ? null
              : s.activeVideoId,
        };
      });
    },
    [setState]
  );

  const selectCategory = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, activeCategoryId: id }));
    },
    [setState]
  );

  const selectVideo = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, activeVideoId: id }));
    },
    [setState]
  );

  const addVideo = useCallback(
    async (url: string, categoryId: string) => {
      const videoId = extractVideoId(url);
      if (!videoId) throw new Error("Couldn't recognize a YouTube URL.");

      // Avoid duplicates in the same category
      if (videos.some((v) => v.videoId === videoId && v.categoryId === categoryId)) {
        throw new Error("Already in this category.");
      }

      let title = "Untitled video";
      let author: string | undefined;
      let thumbnail: string | undefined = thumbnailUrl(videoId);
      try {
        const data = await fetchOEmbed(videoId);
        title = data.title || title;
        author = data.author_name;
        if (data.thumbnail_url) thumbnail = data.thumbnail_url;
      } catch {
        // keep fallback title/thumbnail
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

      setState((s) => ({
        ...s,
        videos: [newVideo, ...s.videos],
        activeVideoId: s.activeVideoId ?? newVideo.id,
      }));
    },
    [setState, videos]
  );

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
      setState((s) => ({
        ...s,
        videos: s.videos.filter((v) => v.id !== id),
        activeVideoId: s.activeVideoId === id ? null : s.activeVideoId,
      }));
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
    },
    [setState]
  );

  const clearAll = useCallback(() => {
    setState((s) => ({
      ...s,
      videos: [],
      activeVideoId: null,
    }));
  }, [setState]);

  const handleProgress = useCallback(
    (currentSeconds: number, durationSeconds: number) => {
      const id = activeVideoId;
      if (!id) return;
      const now = Date.now();
      const last = lastSaveRef.current[id] ?? 0;
      // throttle writes to ~1.5s
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

  const defaultAddCategory =
    activeCategoryId !== "__all__" ? activeCategoryId : categories[0]?.id ?? "podcast";

  return (
    <div className="flex h-dvh w-full bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
      {/* Left: Categories */}
      <div className="hidden w-60 shrink-0 sm:block">
        <CategorySidebar
          categories={categories}
          activeId={activeCategoryId}
          counts={counts}
          onSelect={selectCategory}
          onAdd={addCategory}
          onRemove={removeCategory}
          onClearCategory={clearCategory}
          onClearAll={clearAll}
        />
      </div>

      {/* Middle: Player */}
      <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">
        <div className="shrink-0">
          <AddVideoBar
            categories={categories}
            defaultCategoryId={defaultAddCategory}
            onAdd={addVideo}
          />
        </div>

        <div className="flex flex-1 flex-col items-stretch justify-start gap-4 overflow-hidden">
          <YouTubePlayer
            videoId={hydrated && activeVideo ? activeVideo.videoId : null}
            startSeconds={activeVideo?.watchedSeconds ?? 0}
            onProgress={handleProgress}
            onEnded={handleEnded}
          />

          {activeVideo && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-base font-semibold leading-tight">
                {activeVideo.title}
              </h2>
              {activeVideo.author && (
                <p className="mt-1 text-sm text-zinc-500">
                  {activeVideo.author}
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Right: Queue */}
      <div className="hidden w-80 shrink-0 lg:block">
        <QueuePanel
          videos={filteredVideos}
          activeVideoId={activeVideoId}
          onSelect={selectVideo}
          onComplete={completeVideo}
          onRemove={removeVideo}
        />
      </div>
    </div>
  );
}
