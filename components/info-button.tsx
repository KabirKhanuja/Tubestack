"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Brand, withBrand } from "@/components/brand";

const FEATURES: [string, string][] = [
  ["Folders", "create, rename, delete, and drag to reorder your playlists"],
  [
    "Queue",
    "all your videos in one panel, drag to reorder, track progress automatically",
  ],
  [
    "Progress",
    "red bar shows how much you have watched, updates as you watch",
  ],
  ["Reset", "circular arrow on any video card resets progress to zero"],
  [
    "Chapters",
    "paste timestamps from any YouTube video to jump between sections instantly; move the panel to the sidebar for a cleaner view",
  ],
  [
    "Memory",
    "floating button (bottom right) shows exactly how much localStorage Tubestack is using, broken down by folder",
  ],
  ["Pomodoro", "built-in focus timer with sound alert when done"],
  ["To-do", "quick task list that lives alongside your videos"],
  ["Random Joke", "because why not"],
];

function Section({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-sm font-black uppercase tracking-tight">{title}</h3>
      <div className="text-[13px] font-normal leading-relaxed">{children}</div>
    </div>
  );
}

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
          className="w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] overflow-hidden border-2 border-black bg-white p-0 sm:max-w-sm brutal-shadow dark:border-zinc-100 dark:bg-zinc-900"
        >
          <DialogHeader className="border-b-2 border-black bg-yellow-300 px-4 py-3 dark:border-zinc-100 dark:text-black">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-base font-black uppercase tracking-tight">
                Info
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
          </DialogHeader>

          <div className="flex max-h-[70dvh] flex-col gap-4 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-3 text-center text-sm font-bold uppercase tracking-tight">
              <p>made by (for) kabir khanuja lol</p>
              <p className="flex flex-col items-center gap-1.5">
                <span className="text-xs opacity-70">to contribute</span>
                <a
                  href="https://github.com/KabirKhanuja/Tubestack"
                  target="_blank"
                  rel="noreferrer"
                  className="block max-w-full break-all border-b-2 border-black px-1 text-xs hover:bg-yellow-300 dark:border-zinc-100 dark:hover:text-black"
                >
                  github.com/KabirKhanuja/Tubestack
                </a>
              </p>
            </div>

            <div className="border-t-2 border-black dark:border-zinc-100" />

            <Section title={<>What is <Brand />?</>}>
              <p>
                A distraction free space to watch and manage your YouTube
                videos cause we don't recommend, we arrange. It's just you and your pretty list.
              </p>
            </Section>

            <Section title="How to use">
              <p>
                Paste any YouTube URL in the top bar and press Enter. Pick a
                folder. Done.
              </p>
            </Section>

            <Section title="Features">
              <ul className="flex flex-col gap-1.5">
                {FEATURES.map(([name, desc]) => (
                  <li key={name}>
                    <span className="font-bold uppercase tracking-tight">
                      {name}
                    </span>{" "}
                    : {withBrand(desc)}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Storage">
              <p>
                Everything is saved in your browser&rsquo;s localStorage. No
                account, no server, no tracking.
              </p>
            </Section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
