"use client";

import { useState } from "react";
import { Plus, X, Layers, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Category } from "@/lib/types";

type Props = {
  categories: Category[];
  activeId: string;
  counts: Record<string, number>;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onClearCategory: (id: string) => void;
  onClearAll: () => void;
};

export function CategorySidebar({
  categories,
  activeId,
  counts,
  onSelect,
  onAdd,
  onRemove,
  onClearCategory,
  onClearAll,
}: Props) {
  const [newName, setNewName] = useState("");
  const [memoryOpen, setMemoryOpen] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    onAdd(name);
    setNewName("");
  }

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <aside className="flex h-full w-full flex-col gap-4 border-r border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
      <div className="flex items-center gap-2 px-1 pt-1">
        <Layers className="h-5 w-5 text-red-600" />
        <h1 className="text-lg font-semibold tracking-tight">Tubestack</h1>
      </div>

      <ScrollArea className="-mx-1 flex-1 px-1">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onSelect("__all__")}
            className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
              activeId === "__all__"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
            }`}
          >
            <span className="font-medium">All</span>
            <span className="text-xs opacity-70">{totalCount}</span>
          </button>

          {categories.map((c) => {
            const active = c.id === activeId;
            return (
              <div key={c.id} className="group relative flex items-center">
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className={`flex flex-1 items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="ml-2 text-xs opacity-70">
                    {counts[c.id] ?? 0}
                  </span>
                </button>
                {c.removable && (
                  <button
                    type="button"
                    aria-label={`Remove ${c.name}`}
                    onClick={() => onRemove(c.id)}
                    className="absolute right-1 hidden rounded p-1 text-zinc-500 hover:bg-zinc-300 hover:text-zinc-900 group-hover:block dark:hover:bg-zinc-700 dark:hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Memory Section */}
      <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setMemoryOpen(!memoryOpen)}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
        >
          <Trash2 className="h-4 w-4" />
          <span>Memory</span>
          <ChevronDown
            className={`ml-auto h-3.5 w-3.5 transition-transform ${
              memoryOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {memoryOpen && (
          <div className="flex flex-col gap-2 rounded-md bg-zinc-100 p-2 dark:bg-zinc-800/50">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Clear all videos from "${c.name}"?`
                    )
                  ) {
                    onClearCategory(c.id);
                  }
                }}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-red-100 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
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
              className="flex items-center gap-2 rounded px-2 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear All Memory</span>
            </button>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category"
          className="h-9"
        />
        <Button type="submit" size="icon" className="h-9 w-9 shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </form>
    </aside>
  );
}
