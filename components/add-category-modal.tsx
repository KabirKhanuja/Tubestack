"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

export function AddCategoryModal({ open, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      // focus after the dialog mounts/animates
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] overflow-hidden border-2 border-black bg-white p-0 sm:max-w-sm brutal-shadow dark:border-zinc-100 dark:bg-zinc-900"
      >
        <DialogHeader className="border-b-2 border-black bg-yellow-300 px-4 py-2 dark:border-zinc-100 dark:text-black">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-base font-black uppercase tracking-tight">
              New Category
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
            Give your folder a name.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-3 p-4">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.G. INTERVIEWS"
            maxLength={40}
            className="h-10 w-full border-2 border-black bg-white px-2 text-sm font-bold uppercase text-black placeholder:text-black/40 focus:outline-none focus:brutal-shadow-sm dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-100/40"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 flex-1 border-2 border-black bg-stone-100 text-xs font-black uppercase tracking-tight hover:bg-stone-200 active:translate-x-px active:translate-y-px dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 border-2 border-black bg-yellow-300 text-xs font-black uppercase tracking-tight text-black brutal-shadow-sm hover:bg-yellow-400 active:translate-x-px active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-100"
            >
              <Plus className="h-4 w-4" strokeWidth={3} />
              Add
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
