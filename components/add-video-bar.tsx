"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <form onSubmit={submit} className="flex w-full items-center gap-2">
      <Input
        type="url"
        inputMode="url"
        placeholder="Paste a YouTube URL and press Enter…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="h-10 min-w-0 flex-1"
        disabled={loading}
      />
      <Button type="submit" disabled={loading || !url.trim()} className="h-10">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Add
      </Button>
    </form>
  );
}
