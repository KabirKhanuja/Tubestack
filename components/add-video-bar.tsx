"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/types";

type Props = {
  categories: Category[];
  defaultCategoryId: string;
  onAdd: (url: string, categoryId: string) => Promise<void>;
};

export function AddVideoBar({ categories, defaultCategoryId, onAdd }: Props) {
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categories.find((c) => c.id === categoryId)) {
      setCategoryId(defaultCategoryId);
    }
  }, [categories, categoryId, defaultCategoryId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onAdd(url.trim(), categoryId);
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add video");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-full flex-wrap items-center gap-2"
    >
      <Input
        type="url"
        inputMode="url"
        placeholder="Paste a YouTube URL…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="h-10 min-w-0 flex-1"
        disabled={loading}
      />
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm shadow-xs outline-none focus:ring-2 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-900"
        disabled={loading}
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={loading || !url.trim()} className="h-10">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Add
      </Button>
      {error && (
        <p className="w-full text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
