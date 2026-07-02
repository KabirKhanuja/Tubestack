"use client";

import { useEffect, useRef, useState } from "react";
import { PanelRight, Undo2 } from "lucide-react";
import { formatDuration } from "@/lib/youtube";

type Props = {
  videoId: string;
  onSeek: (seconds: number) => void;
  /** "center" = collapsible box below the video; "sidebar" = full-height panel. */
  variant?: "center" | "sidebar";
  /** When provided (desktop only), shows a button to move the panel. */
  onMove?: () => void;
  /** Current playback position in seconds — used to highlight the active chapter. */
  getCurrentTime?: () => number | null;
  /** YouTube player state (1 = playing) — polling pauses while not playing. */
  getPlayerState?: () => number | null;
};

const YT_PLAYING = 1;

/** Index of the chapter whose start is the latest one at/behind the given time. */
function activeChapterIndex(chapters: Chapter[], time: number): number {
  let active = -1;
  let best = -Infinity;
  for (let i = 0; i < chapters.length; i++) {
    const s = chapters[i].seconds;
    if (s <= time && s >= best) {
      best = s;
      active = i;
    }
  }
  return active;
}

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

export function ChaptersPanel({
  videoId,
  onSeek,
  variant = "center",
  onMove,
  getCurrentTime,
  getPlayerState,
}: Props) {
  const initial = loadForVideo(videoId);
  const [open, setOpen] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>(initial?.chapters ?? []);
  const [raw, setRaw] = useState(initial?.raw ?? "");
  const [editing, setEditing] = useState((initial?.chapters.length ?? 0) === 0);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const sidebar = variant === "sidebar";

  // Keep the latest accessors in refs so the polling effect doesn't restart
  // every render (parents pass fresh inline closures).
  const getCurrentTimeRef = useRef(getCurrentTime);
  const getPlayerStateRef = useRef(getPlayerState);
  getCurrentTimeRef.current = getCurrentTime;
  getPlayerStateRef.current = getPlayerState;

  // Poll playback time once a second to highlight the active chapter. The
  // interval is torn down on unmount (video deselected) and when there are no
  // chapters; ticks are skipped while the player isn't playing.
  useEffect(() => {
    if (chapters.length === 0) {
      setActiveIndex(-1);
      return;
    }
    const id = setInterval(() => {
      const state = getPlayerStateRef.current?.();
      if (state != null && state !== YT_PLAYING) return;
      const t = getCurrentTimeRef.current?.();
      if (typeof t !== "number") return;
      const next = activeChapterIndex(chapters, t);
      setActiveIndex((prev) => (prev === next ? prev : next));
    }, 1000);
    return () => clearInterval(id);
  }, [chapters]);

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

  const moveButton = onMove ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onMove();
      }}
      title={sidebar ? "Move back below video" : "Move to sidebar"}
      aria-label={sidebar ? "Move chapters back below video" : "Move chapters to sidebar"}
      className="grid h-6 w-6 shrink-0 place-items-center border-2 border-black bg-white text-black hover:bg-yellow-300 active:translate-x-px active:translate-y-px dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-yellow-300 dark:hover:text-black"
    >
      {sidebar ? (
        <Undo2 className="h-3.5 w-3.5" strokeWidth={3} />
      ) : (
        <PanelRight className="h-3.5 w-3.5" strokeWidth={3} />
      )}
    </button>
  ) : null;

  const editor = (
    <div className="flex flex-col gap-2">
      {sidebar && chapters.length === 0 && (
        <p className="font-mono text-[10px] uppercase opacity-60">
          No chapters yet. Paste timestamps below.
        </p>
      )}
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={5}
        placeholder={"Paste timestamps, one per line:\n0:00 Intro\n1:23 - Setup\n[1:03:08](url) Deep dive"}
        className="w-full resize-y border-2 border-black bg-white px-2 py-1.5 font-mono text-xs text-black placeholder:text-black/40 focus:outline-none dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-100/40"
      />
      {notice && (
        <p className="font-mono text-[10px] uppercase text-red-600">{notice}</p>
      )}
      <button
        type="button"
        onClick={handleSave}
        className="self-start border-2 border-black bg-black px-3 py-1.5 text-xs font-black uppercase tracking-tight text-white brutal-shadow-sm hover:bg-zinc-800 active:translate-x-px active:translate-y-px active:shadow-none dark:border-zinc-100 dark:bg-zinc-100 dark:text-black"
      >
        Save
      </button>
    </div>
  );

  const list = (
    <div className="flex flex-col gap-2">
      <ul
        className={`flex flex-col gap-1 ${
          sidebar ? "" : "max-h-[250px] overflow-y-auto"
        }`}
      >
        {chapters.map((c, i) => (
          <li key={i} className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => onSeek(c.seconds)}
              className={`shrink-0 border-2 border-black px-1.5 py-0.5 font-mono text-[11px] font-black text-black transition-colors active:translate-x-px active:translate-y-px dark:border-black ${
                i === activeIndex
                  ? "bg-yellow-300 hover:bg-yellow-400"
                  : "bg-orange-400 hover:bg-orange-500"
              }`}
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
  );

  // Sidebar variant: full-height panel matching the QUEUE panel styling.
  if (sidebar) {
    return (
      <div
        className="dotted-bg flex h-full w-full flex-col border-l-2 border-black bg-stone-50 dark:border-zinc-100 dark:bg-zinc-950"
        style={{ animation: "widget-slide-up 0.18s ease-out" }}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b-2 border-black bg-yellow-300 px-3 py-2 brutal-shadow dark:border-zinc-100 dark:text-black">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase tracking-tight">
              Chapters
            </h2>
            {chapters.length > 0 && (
              <span className="font-mono text-xs font-bold opacity-70">
                {chapters.length.toString().padStart(2, "0")}
              </span>
            )}
          </div>
          {moveButton}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {editing ? editor : list}
        </div>
      </div>
    );
  }

  // Center variant: collapsible box below the video (unchanged behavior).
  return (
    <div className="border-2 border-black bg-white dark:border-zinc-100 dark:bg-zinc-900">
      <div
        className={`flex w-full items-center gap-1.5 ${onMove ? "pr-1.5" : ""}`}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-tight hover:bg-yellow-300 dark:hover:bg-yellow-300 dark:hover:text-black ${
            onMove ? "flex-1" : "w-full"
          }`}
        >
          <span aria-hidden>{open ? "▲" : "▼"}</span>
          <span>Chapters</span>
          {chapters.length > 0 && (
            <span className="ml-auto font-mono text-[10px] opacity-60">
              {chapters.length}
            </span>
          )}
        </button>
        {moveButton}
      </div>

      {open && (
        <div className="border-t-2 border-black p-2 dark:border-zinc-100">
          {editing ? editor : list}
        </div>
      )}
    </div>
  );
}
