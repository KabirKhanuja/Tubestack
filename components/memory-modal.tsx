"use client";

import { Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Category } from "@/lib/types";

type Props = {
  open: boolean;
  categories: Category[];
  counts: Record<string, number>;
  onClose: () => void;
  onClearCategory: (id: string) => void;
  onClearAll: () => void;
};

export function MemoryModal({
  open,
  categories,
  counts,
  onClose,
  onClearCategory,
  onClearAll,
}: Props) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] overflow-hidden border-2 border-black bg-white p-0 sm:max-w-sm brutal-shadow dark:border-zinc-100 dark:bg-zinc-900"
      >
        <DialogHeader className="border-b-2 border-black bg-yellow-300 px-4 py-2 dark:border-zinc-100 dark:text-black">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-base font-black uppercase tracking-tight">
              Memory
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>
          <DialogDescription className="text-[11px] font-bold uppercase opacity-80">
            Wipe a folder or everything. No undo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 p-3">
          {categories.length === 0 ? (
            <p className="py-4 text-center text-xs font-bold uppercase opacity-60">
              No categories yet.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {categories.map((c) => {
                const count = counts[c.id] ?? 0;
                const disabled = count === 0;
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Clear all videos from "${c.name}"?`
                        )
                      ) {
                        onClearCategory(c.id);
                      }
                    }}
                    className="flex items-center justify-between gap-2 border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase tracking-tight text-black transition-colors hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-red-500 dark:disabled:hover:bg-zinc-950 dark:disabled:hover:text-zinc-100"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Trash2 className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />
                      <span className="truncate">Clear {c.name}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] opacity-70">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            disabled={totalCount === 0}
            onClick={() => {
              if (
                window.confirm("Clear ALL videos from all categories?")
              ) {
                onClearAll();
                onClose();
              }
            }}
            className="mt-2 flex items-center justify-center gap-1.5 border-2 border-black bg-red-500 px-3 py-2.5 text-xs font-black uppercase tracking-tight text-white brutal-shadow-sm hover:bg-red-600 active:translate-x-px active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-100"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={3} />
            Clear All Memory ({totalCount})
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
