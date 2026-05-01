"use client";

import { Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { thumbnailUrl } from "@/lib/youtube";
import type { Category } from "@/lib/types";

export type PendingVideo = {
  videoId: string;
  title: string;
  author?: string;
  thumbnail?: string;
};

type Props = {
  open: boolean;
  loading: boolean;
  pending: PendingVideo | null;
  categories: Category[];
  onPick: (categoryId: string) => void;
  onClose: () => void;
};

export function CategoryPickerModal({
  open,
  loading,
  pending,
  categories,
  onPick,
  onClose,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Where should this go?</DialogTitle>
          <DialogDescription>
            Pick a category to add this video to your queue.
          </DialogDescription>
        </DialogHeader>

        {loading || !pending ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Fetching video info…
          </div>
        ) : (
          <>
            <div className="flex gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pending.thumbnail || thumbnailUrl(pending.videoId)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-col justify-center">
                <p className="line-clamp-2 text-sm font-medium leading-snug">
                  {pending.title}
                </p>
                {pending.author && (
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {pending.author}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-3">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onPick(c.id)}
                  className="group flex h-16 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 shadow-xs transition-all hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-50 hover:text-red-700 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                >
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-2 flex items-center justify-center gap-1.5 self-center text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
