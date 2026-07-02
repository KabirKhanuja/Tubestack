"use client";

import { useState } from "react";
import { formatDuration } from "@/lib/youtube";

type Props = {
  videoId: string;
  onSeek: (seconds: number) => void;
};

type Chapter = { seconds: number; label: string };

const CHAPTERS_KEY = "tubestack:chapters:v1";

type StoredEntry = { raw: string; chapters: Chapter[] };
type Store = Record<string, StoredEntry>;

function loadStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CHAPTERS_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function loadForVideo(videoId: string): StoredEntry | null {
  return loadStore()[videoId] ?? null;
}

function saveForVideo(videoId: string, entry: StoredEntry): void {
  if (typeof window === "undefined") return;
  try {
    const store = loadStore();
    if (entry.chapters.length === 0 && !entry.raw.trim()) {
      delete store[videoId];
    } else {
      store[videoId] = entry;
    }
    window.localStorage.setItem(CHAPTERS_KEY, JSON.stringify(store));
  } catch {
    // quota / serialization — ignore
  }
}

// m:ss, mm:ss, h:mm:ss, hh:mm:ss (minutes/seconds are always 2 digits)
const TIMESTAMP_RE = /(\d{1,2}:\d{2}(?::\d{2})?)/;

function toSeconds(ts: string): number {
  const parts = ts.split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

/** Parse pasted text into chapters, one per line containing a timestamp. */
function parseChapters(text: string): Chapter[] {
  const out: Chapter[] = [];
  for (const line of text.split("\n")) {
    // Collapse markdown links [label](url) down to just their label text,
    // so "[0:00](https://…) Intro" becomes "0:00 Intro".
    const cleaned = line.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
    const m = cleaned.match(TIMESTAMP_RE);
    if (!m) continue;
    const seconds = toSeconds(m[1]);
    // Everything after the timestamp is the label; drop leading separators.
    const after = cleaned
      .slice((m.index ?? 0) + m[1].length)
      .replace(/^[\s\-–—:·|)\]]+/, "")
      .trim();
    out.push({ seconds, label: after });
  }
  return out;
}

export function ChaptersPanel({ videoId, onSeek }: Props) {
  const initial = loadForVideo(videoId);
  const [open, setOpen] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>(initial?.chapters ?? []);
  const [raw, setRaw] = useState(initial?.raw ?? "");
  const [editing, setEditing] = useState((initial?.chapters.length ?? 0) === 0);
  const [notice, setNotice] = useState<string | null>(null);

  function handleSave() {
    const parsed = parseChapters(raw);
    setChapters(parsed);
    saveForVideo(videoId, { raw, chapters: parsed });
    if (parsed.length === 0) {
      setNotice("No valid timestamps found.");
      return;
    }
    setNotice(null);
    setEditing(false);
  }

  return (
    <div className="border-2 border-black bg-white dark:border-zinc-100 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-tight hover:bg-yellow-300 dark:hover:bg-yellow-300 dark:hover:text-black"
      >
        <span aria-hidden>{open ? "▲" : "▼"}</span>
        <span>Chapters</span>
        {chapters.length > 0 && (
          <span className="ml-auto font-mono text-[10px] opacity-60">
            {chapters.length}
          </span>
        )}
      </button>

      {open && (
        <div className="border-t-2 border-black p-2 dark:border-zinc-100">
          {editing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                rows={5}
                placeholder={"Paste timestamps, one per line:\n0:00 Intro\n1:23 - Setup\n[1:03:08](url) Deep dive"}
                className="w-full resize-y border-2 border-black bg-white px-2 py-1.5 font-mono text-xs text-black placeholder:text-black/40 focus:outline-none dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-100/40"
              />
              {notice && (
                <p className="font-mono text-[10px] uppercase text-red-600">
                  {notice}
                </p>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="self-start border-2 border-black bg-black px-3 py-1.5 text-xs font-black uppercase tracking-tight text-white brutal-shadow-sm hover:bg-zinc-800 active:translate-x-px active:translate-y-px active:shadow-none dark:border-zinc-100 dark:bg-zinc-100 dark:text-black"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <ul className="flex max-h-[250px] flex-col gap-1 overflow-y-auto">
                {chapters.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => onSeek(c.seconds)}
                      className="shrink-0 border-2 border-black bg-yellow-300 px-1.5 py-0.5 font-mono text-[11px] font-black text-black hover:bg-yellow-400 active:translate-x-px active:translate-y-px dark:border-black"
                    >
                      {formatDuration(c.seconds)}
                    </button>
                    {c.label && (
                      <span className="pt-0.5 text-xs font-bold leading-snug">
                        {c.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  setNotice(null);
                  setEditing(true);
                }}
                className="self-start border-2 border-black bg-white px-3 py-1.5 text-xs font-black uppercase tracking-tight text-black hover:bg-stone-200 active:translate-x-px active:translate-y-px dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
