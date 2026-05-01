"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  GripVertical,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDragReorder } from "@/lib/dnd";
import { CATEGORY_COLORS, type Category } from "@/lib/types";

const VIDEO_MIME = "application/x-tubestack-video";

function dragHasVideo(e: React.DragEvent): boolean {
  const types = e.dataTransfer?.types;
  if (!types) return false;
  return Array.from(types).includes(VIDEO_MIME);
}

type Props = {
  categories: Category[];
  activeId: string;
  counts: Record<string, number>;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRemove: (id: string, moveToCategoryId: string | null) => void;
  onReorder: (fromId: string, toId: string) => void;
  onClearCategory: (id: string) => void;
  onClearAll: () => void;
  onVideoDropToCategory: (videoId: string, categoryId: string) => void;
};

const HATCH = "repeating-linear-gradient(-45deg,transparent 0px,transparent 5px,rgba(0,0,0,0.09) 5px,rgba(0,0,0,0.09) 6px)";
const HATCH_DARK = "repeating-linear-gradient(-45deg,transparent 0px,transparent 5px,rgba(255,255,255,0.13) 5px,rgba(255,255,255,0.13) 6px)";

function catStyle(color: string, active: boolean, dark = false) {
  if (active) {
    return {
      backgroundColor: color,
      backgroundImage: dark ? HATCH_DARK : HATCH,
      boxShadow: dark ? "2px 2px 0 0 rgba(255,255,255,0.9)" : "2px 2px 0 0 #000",
    };
  }
  return {
    backgroundColor: dark ? `${color}22` : `${color}33`,
  };
}

export function CategorySidebar({
  categories,
  activeId,
  counts,
  onSelect,
  onAdd,
  onRemove,
  onReorder,
  onClearCategory,
  onClearAll,
  onVideoDropToCategory,
}: Props) {
  const [newName, setNewName] = useState("");
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [videoDropTarget, setVideoDropTarget] = useState<string | null>(null);

  const dnd = useDragReorder(onReorder);

  // Clear cross-panel drop highlight when any drag ends
  useEffect(() => {
    const clear = () => setVideoDropTarget(null);
    window.addEventListener("dragend", clear);
    window.addEventListener("drop", clear);
    return () => {
      window.removeEventListener("dragend", clear);
      window.removeEventListener("drop", clear);
    };
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    onAdd(name);
    setNewName("");
  }

  function handleDeleteClick(id: string) {
    const count = counts[id] ?? 0;
    if (count === 0) {
      if (window.confirm("Delete this category?")) onRemove(id, null);
      return;
    }
    setPendingDelete(id);
  }

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const pendingCategory = pendingDelete
    ? categories.find((c) => c.id === pendingDelete)
    : null;
  const reassignTargets = pendingDelete
    ? categories.filter((c) => c.id !== pendingDelete)
    : [];

  return (
    <aside className="dotted-bg flex h-full w-full flex-col gap-2 border-r-2 border-black bg-stone-50 p-2 dark:border-zinc-100 dark:bg-zinc-950">
      {/* Brand header */}
      <div className="flex items-center justify-between border-2 border-black bg-yellow-300 px-2 py-2 brutal-shadow dark:border-zinc-100 dark:text-black">
        <h1 className="text-base font-black tracking-tight uppercase">Tubestack</h1>
        <span className="font-mono text-[10px] font-bold">v1</span>
      </div>

      <ScrollArea className="-mx-1 flex-1 px-1">
        <div className="flex flex-col gap-1" onDragEnd={dnd.onDragEnd}>
          {/* ALL button */}
          <button
            type="button"
            onClick={() => onSelect("__all__")}
            className={`flex h-9 items-center justify-between border-2 border-black px-2 text-sm font-bold uppercase transition-all dark:border-zinc-100 ${
              activeId === "__all__"
                ? "bg-black text-white brutal-shadow dark:bg-zinc-100 dark:text-black"
                : "bg-white hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            }`}
          >
            <span>All</span>
            <span className="font-mono text-xs">{totalCount}</span>
          </button>

          {categories.map((c) => {
            const active = c.id === activeId;
            const color = c.color ?? CATEGORY_COLORS[0];
            const dragging = dnd.draggingId === c.id;
            const dropTarget = dnd.overId === c.id && dnd.draggingId !== c.id;
            const videoOver = videoDropTarget === c.id;

            return (
              <div
                key={c.id}
                draggable
                onDragStart={dnd.onDragStart(c.id)}
                onDragOver={(e) => {
                  if (dragHasVideo(e)) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (videoDropTarget !== c.id) setVideoDropTarget(c.id);
                    return;
                  }
                  dnd.onDragOver(c.id)(e);
                }}
                onDragLeave={(e) => {
                  if (dragHasVideo(e)) {
                    if (videoDropTarget === c.id) setVideoDropTarget(null);
                    return;
                  }
                  dnd.onDragLeave(c.id)(e);
                }}
                onDrop={(e) => {
                  const videoId = e.dataTransfer.getData(VIDEO_MIME);
                  if (videoId) {
                    e.preventDefault();
                    onVideoDropToCategory(videoId, c.id);
                    setVideoDropTarget(null);
                    return;
                  }
                  dnd.onDrop(c.id)(e);
                }}
                className={`group relative flex h-9 items-center border-2 transition-all ${
                  videoOver
                    ? "border-red-500 ring-2 ring-red-500"
                    : "border-black dark:border-zinc-100"
                } ${dragging ? "opacity-40" : ""} ${dropTarget ? "translate-y-px" : ""} ${
                  videoOver ? "translate-y-px brutal-shadow-sm" : ""
                }`}
                style={
                  active
                    ? {
                        backgroundColor: color,
                        backgroundImage: HATCH,
                        boxShadow: "2px 2px 0 0 #000",
                      }
                    : { backgroundColor: `${color}99` }
                }
              >
                <span
                  className="flex h-full cursor-grab items-center pl-1 pr-0.5 opacity-60 active:cursor-grabbing"
                  aria-hidden
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className="flex flex-1 items-center justify-between gap-2 px-1 text-sm font-bold uppercase text-black"
                >
                  <span className="truncate">{c.name}</span>
                  <span className="font-mono text-xs opacity-80">
                    {counts[c.id] ?? 0}
                  </span>
                </button>
                {c.removable && (
                  <button
                    type="button"
                    aria-label={`Delete ${c.name}`}
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(c.id);
                    }}
                    className="hidden h-full px-1.5 hover:bg-red-500 hover:text-white group-hover:block"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Pending delete panel */}
      {pendingCategory && (
        <div className="border-2 border-black bg-red-500 p-2 text-xs font-bold text-white brutal-shadow dark:border-zinc-100">
          <p className="mb-1.5 leading-snug">
            DELETE &ldquo;{pendingCategory.name.toUpperCase()}&rdquo;?{" "}
            <span className="font-mono font-normal">
              ({counts[pendingCategory.id]} videos)
            </span>
          </p>
          <p className="mb-1 text-[10px] uppercase opacity-90">Move videos to:</p>
          <div className="flex flex-col gap-1">
            {reassignTargets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onRemove(pendingCategory.id, t.id);
                  setPendingDelete(null);
                }}
                className="border-2 border-black bg-white px-2 py-1 text-left text-black uppercase hover:bg-yellow-300 dark:border-zinc-900"
              >
                → {t.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete "${pendingCategory.name}" and all its videos?`)) {
                  onRemove(pendingCategory.id, null);
                  setPendingDelete(null);
                }
              }}
              className="border-2 border-black bg-black px-2 py-1 text-left uppercase hover:bg-zinc-800 dark:border-zinc-100"
            >
              Delete videos too
            </button>
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              className="border-2 border-black bg-stone-200 px-2 py-1 text-left text-black uppercase hover:bg-stone-300 dark:border-zinc-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Memory / clear section */}
      <div className="flex flex-col gap-1 border-t-2 border-black pt-2 dark:border-zinc-100">
        <button
          type="button"
          onClick={() => setMemoryOpen(!memoryOpen)}
          className="flex h-8 items-center gap-1.5 border-2 border-black bg-white px-2 text-xs font-bold uppercase hover:bg-stone-200 dark:border-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <Trash2 className="h-3 w-3" />
          <span>Memory</span>
          <ChevronDown
            className={`ml-auto h-3 w-3 transition-transform ${memoryOpen ? "rotate-180" : ""}`}
          />
        </button>

        {memoryOpen && (
          <div className="flex flex-col gap-1 border-2 border-black bg-stone-200 p-1 dark:border-zinc-100 dark:bg-zinc-800">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  if (window.confirm(`Clear all videos from "${c.name}"?`)) {
                    onClearCategory(c.id);
                  }
                }}
                className="flex items-center gap-1 px-1.5 py-1 text-left text-[11px] font-bold uppercase hover:bg-red-500 hover:text-white"
              >
                <X className="h-3 w-3" />
                <span>Clear {c.name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Clear ALL videos from all categories?")) {
                  onClearAll();
                }
              }}
              className="flex items-center gap-1 border-t-2 border-black px-1.5 py-1 text-left text-[11px] font-black uppercase text-red-700 hover:bg-red-500 hover:text-white dark:border-zinc-100"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {/* Add category form */}
      <form onSubmit={submit} className="flex brutal-shadow">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="NEW CATEGORY"
          className="h-9 min-w-0 flex-1 border-2 border-r-0 border-black bg-white px-2 text-xs font-bold uppercase placeholder:text-black/40 focus:outline-none dark:border-zinc-100 dark:bg-zinc-900"
        />
        <button
          type="submit"
          aria-label="Add category"
          className="grid h-9 w-9 shrink-0 place-items-center border-2 border-black bg-yellow-300 hover:bg-yellow-400 active:translate-x-px active:translate-y-px dark:border-zinc-100 dark:text-black"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </button>
      </form>
    </aside>
  );
}
