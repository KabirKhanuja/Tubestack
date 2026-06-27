"use client";

import { useEffect, useState } from "react";
import { Database, X } from "lucide-react";
import { Brand } from "@/components/brand";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Category, Video } from "@/lib/types";

const TUBESTACK_PREFIX = "tubestack";
const MAIN_KEY = "tubestack:v1";
const LIMIT_BYTES = 5 * 1024 * 1024; // ~5MB typical localStorage quota

type CategoryStat = {
  id: string;
  name: string;
  videoCount: number;
  bytes: number;
};

type Stats = {
  totalBytes: number;
  totalVideos: number;
  totalCategories: number;
  categories: CategoryStat[];
};

function byteSize(value: string): number {
  return new Blob([value]).size;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function computeStats(): Stats {
  if (typeof window === "undefined") {
    return { totalBytes: 0, totalVideos: 0, totalCategories: 0, categories: [] };
  }

  // 1. Total usage across every Tubestack localStorage key
  let totalBytes = 0;
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(TUBESTACK_PREFIX)) continue;
    const value = window.localStorage.getItem(key) ?? "";
    totalBytes += byteSize(value) + byteSize(key);
  }

  // 2. Breakdown by category (videos + category metadata live in the main key)
  let categories: Category[] = [];
  let videos: Video[] = [];
  try {
    const raw = window.localStorage.getItem(MAIN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<{
        categories: Category[];
        videos: Video[];
      }>;
      categories = parsed.categories ?? [];
      videos = parsed.videos ?? [];
    }
  } catch {
    // corrupt/absent main key — fall back to empties
  }

  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  const grouped = new Map<string, Video[]>();
  for (const v of videos) {
    const list = grouped.get(v.categoryId);
    if (list) list.push(v);
    else grouped.set(v.categoryId, [v]);
  }

  // Ensure every known category shows up, even when empty
  const ids = new Set<string>([...nameById.keys(), ...grouped.keys()]);
  const categoryStats: CategoryStat[] = [...ids].map((id) => {
    const list = grouped.get(id) ?? [];
    return {
      id,
      name: nameById.get(id) ?? "Uncategorized",
      videoCount: list.length,
      bytes: byteSize(JSON.stringify(list)),
    };
  });
  categoryStats.sort((a, b) => b.bytes - a.bytes);

  return {
    totalBytes,
    totalVideos: videos.length,
    totalCategories: categories.length,
    categories: categoryStats,
  };
}

export function MemoryStatsButton() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  // While open, keep stats live: recompute on open, on cross-tab storage
  // events, and poll for same-tab writes (localStorage fires no event locally).
  useEffect(() => {
    if (!open) return;
    const refresh = () => setStats(computeStats());
    refresh();
    const interval = window.setInterval(refresh, 1000);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", refresh);
    };
  }, [open]);

  const usedPct = stats
    ? Math.min(100, (stats.totalBytes / LIMIT_BYTES) * 100)
    : 0;
  const maxCatBytes = stats
    ? Math.max(1, ...stats.categories.map((c) => c.bytes))
    : 1;

  return (
    <>
      {/* Floating button — bottom-right, clear of the bottom-left memory FAB */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Memory usage"
        title="Memory usage"
        className="fixed bottom-4 right-4 z-40 grid h-12 w-12 place-items-center rounded-full border-[3px] border-black bg-white text-black shadow-[3px_3px_0_0_#000] transition-transform hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px active:shadow-none dark:border-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.9)]"
      >
        <Database className="h-5 w-5" strokeWidth={2.5} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[85dvh] w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-none border-[3px] border-black bg-white p-0 shadow-[5px_5px_0_0_#000] sm:max-w-md dark:border-zinc-100 dark:bg-zinc-900 dark:shadow-[5px_5px_0_0_rgba(255,255,255,0.9)]"
        >
          <DialogHeader className="shrink-0 border-b-[3px] border-black bg-yellow-300 px-4 py-2 dark:border-zinc-100 dark:text-black">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-base font-black uppercase tracking-tight">
                Memory Usage
              </DialogTitle>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="shrink-0 opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
            <DialogDescription className="text-[11px] font-bold uppercase opacity-80">
              Local storage used by <Brand />.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {!stats ? (
              <p className="py-6 text-center text-xs font-bold uppercase opacity-60">
                Reading storage…
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {/* 1. Total usage */}
                <section>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-xs font-black uppercase tracking-tight">
                      Total Usage
                    </h3>
                    <span className="font-mono text-[11px] font-bold opacity-70">
                      {formatBytes(stats.totalBytes)} of 5 MB
                    </span>
                  </div>
                  <div className="mt-1.5 h-4 w-full border-2 border-black bg-stone-100 dark:border-zinc-100 dark:bg-zinc-950">
                    <div
                      className="h-full bg-yellow-300 transition-all"
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase opacity-60">
                    {usedPct < 0.1 ? "<0.1" : usedPct.toFixed(1)}% used
                  </p>
                </section>

                {/* 3. Other info */}
                <section className="grid grid-cols-2 gap-2">
                  <Stat label="Videos" value={stats.totalVideos} />
                  <Stat label="Categories" value={stats.totalCategories} />
                </section>

                {/* 2. Breakdown by category */}
                <section>
                  <h3 className="mb-1.5 text-xs font-black uppercase tracking-tight">
                    By Category
                  </h3>
                  {stats.categories.length === 0 ? (
                    <p className="py-3 text-center text-xs font-bold uppercase opacity-60">
                      No categories yet.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {stats.categories.map((c) => (
                        <div
                          key={c.id}
                          className="border-2 border-black bg-white px-2.5 py-2 dark:border-zinc-100 dark:bg-zinc-950"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-xs font-black uppercase tracking-tight">
                              {c.name}
                            </span>
                            <span className="shrink-0 font-mono text-[10px] font-bold opacity-70">
                              {formatBytes(c.bytes)}
                            </span>
                          </div>
                          <div className="mt-1.5 h-2.5 w-full border-2 border-black bg-stone-100 dark:border-zinc-100 dark:bg-zinc-900">
                            <div
                              className="h-full bg-black dark:bg-zinc-100"
                              style={{
                                width: `${Math.max(
                                  c.bytes > 0 ? 4 : 0,
                                  (c.bytes / maxCatBytes) * 100
                                )}%`,
                              }}
                            />
                          </div>
                          <p className="mt-1 font-mono text-[10px] uppercase opacity-60">
                            {c.videoCount} video{c.videoCount === 1 ? "" : "s"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t-[3px] border-black p-3 dark:border-zinc-100">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center border-2 border-black bg-yellow-300 px-3 py-2.5 text-xs font-black uppercase tracking-tight text-black brutal-shadow-sm hover:bg-yellow-400 active:translate-x-px active:translate-y-px active:shadow-none dark:border-zinc-100"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-2 border-black bg-white px-3 py-2 dark:border-zinc-100 dark:bg-zinc-950">
      <p className="font-mono text-lg font-black leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-tight opacity-60">
        {label}
      </p>
    </div>
  );
}
