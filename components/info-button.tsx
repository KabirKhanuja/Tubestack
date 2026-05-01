"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function InfoButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 place-items-center rounded-full border-2 border-black bg-white brutal-shadow transition-transform hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_#000] active:translate-x-px active:translate-y-px active:shadow-none dark:border-zinc-100 dark:bg-zinc-900"
        aria-label="Info"
      >
        <Info className="h-5 w-5" strokeWidth={3} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="border-2 border-black bg-white p-0 sm:max-w-sm brutal-shadow dark:border-zinc-100 dark:bg-zinc-900"
        >
          <DialogHeader className="border-b-2 border-black bg-yellow-300 px-4 py-3 dark:border-zinc-100 dark:text-black">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-black uppercase tracking-tight">
                Info
              </DialogTitle>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
          </DialogHeader>

          <div className="p-4 flex flex-col gap-4 text-sm font-bold uppercase tracking-tight text-center">
            <p>
              made by (for) kabir khanuja lol
            </p>
            <p>
              to contribute :{" "}
              <a
                href="https://github.com/KabirKhanuja/Tubestack"
                target="_blank"
                rel="noreferrer"
                className="inline-block border-b-2 border-black hover:bg-yellow-300 dark:border-zinc-100 dark:hover:text-black"
              >
                https://github.com/KabirKhanuja/Tubestack
              </a>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
