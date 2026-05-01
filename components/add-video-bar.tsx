"use client";

import { useState } from "react";
import { Loader2, Link as LinkIcon } from "lucide-react";

type Props = {
  loading: boolean;
  onSubmit: (url: string) => void | Promise<void>;
};

export function AddVideoBar({ loading, onSubmit }: Props) {
  const [url, setUrl] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    const value = url.trim();
    setUrl("");
    await onSubmit(value);
  }

  return (
    <form onSubmit={submit} className="flex w-full items-center">
      <div className="relative flex h-10 flex-1 items-center border-2 border-black bg-white brutal-shadow focus-within:translate-x-px focus-within:translate-y-px focus-within:shadow-none dark:border-zinc-100 dark:bg-zinc-900 transition-all">
        <div className="grid h-full w-10 place-items-center border-r-2 border-black bg-yellow-300 dark:border-zinc-100 dark:text-black">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LinkIcon className="h-4 w-4" />
          )}
        </div>
        <input
          type="url"
          inputMode="url"
          placeholder="Paste a YouTube URL → press Enter"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          className="h-full w-full min-w-0 bg-transparent px-3 text-sm font-semibold placeholder:font-medium placeholder:text-black/50 focus:outline-none dark:placeholder:text-zinc-400"
        />
      </div>
    </form>
  );
}
