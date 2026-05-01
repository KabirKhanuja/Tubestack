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
      <DialogContent
        showCloseButton={false}
        className="border-2 border-black bg-white p-0 sm:max-w-lg dark:border-zinc-100 dark:bg-zinc-900"
      >
        <DialogHeader className="border-b-2 border-black bg-yellow-300 px-4 py-2 dark:border-zinc-100 dark:text-black">
          <DialogTitle className="text-base font-black uppercase tracking-tight">
            Pick a folder
          </DialogTitle>
          <DialogDescription className="text-[11px] font-bold uppercase opacity-80">
            Click any category — video drops in instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3">
          {loading || !pending ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm font-bold uppercase">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching…
            </div>
          ) : (
            <>
              <div className="mb-3 flex gap-2 border-2 border-black bg-stone-50 p-2 dark:border-zinc-100 dark:bg-zinc-800">
                <div className="relative h-16 w-28 shrink-0 overflow-hidden border-2 border-black bg-stone-200 dark:border-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pending.thumbnail || thumbnailUrl(pending.videoId)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-col justify-center">
                  <p className="line-clamp-2 text-sm font-bold leading-snug">
                    {pending.title}
                  </p>
                  {pending.author && (
                    <p className="mt-0.5 truncate font-mono text-[10px] uppercase opacity-70">
                      {pending.author}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onPick(c.id)}
                    className="flex h-14 items-center justify-center border-2 border-black bg-white px-2 text-sm font-black uppercase tracking-tight transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-yellow-300 hover:brutal-shadow active:translate-x-0 active:translate-y-0 active:shadow-none dark:border-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-yellow-400 dark:hover:text-black"
                  >
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="mt-3 flex w-full items-center justify-center gap-1 border-2 border-black bg-stone-100 py-1.5 text-xs font-bold uppercase hover:bg-stone-200 dark:border-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
