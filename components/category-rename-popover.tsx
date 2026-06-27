"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const POPOVER_WIDTH = 224; // matches w-56
const MARGIN = 8;

type Props = {
  /** Bounding rect of the pencil trigger, captured on click. */
  anchor: DOMRect;
  /** Category color — popover + input background. */
  color: string;
  /** Current category name, pre-filled into the input. */
  name: string;
  onRename: (name: string) => void;
  onDelete: () => void;
  onClose: () => void;
};

export function CategoryRenamePopover({
  anchor,
  color,
  name,
  onRename,
  onDelete,
  onClose,
}: Props) {
  const ref = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(name);

  // Select the text so the user can immediately overwrite it
  useLayoutEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // Escape, click-outside, and scroll all close without saving
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onClose, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = value.trim();
    if (next && next !== name) onRename(next);
    onClose();
  }

  // Clamp horizontally so the popover stays on-screen, anchored below the pencil
  const left = Math.max(
    MARGIN,
    Math.min(anchor.left, window.innerWidth - POPOVER_WIDTH - MARGIN)
  );
  const top = anchor.bottom + 6;

  return (
    <form
      ref={ref}
      onSubmit={submit}
      style={{
        position: "fixed",
        top,
        left,
        width: POPOVER_WIDTH,
        backgroundColor: color,
      }}
      className="z-50 flex flex-col gap-2 border-[3px] border-black p-2 shadow-[4px_4px_0_0_#000] dark:border-black"
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={40}
        aria-label="Category name"
        style={{ backgroundColor: color }}
        className="h-9 w-full border-2 border-black px-2 text-sm font-bold uppercase text-black placeholder:text-black/40 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 border-2 border-black bg-black px-2 py-1.5 text-xs font-black uppercase tracking-tight text-white hover:bg-zinc-800 active:translate-x-px active:translate-y-px"
        >
          Rename
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onDelete();
          }}
          className="flex-1 border-2 border-black bg-white px-2 py-1.5 text-xs font-black uppercase tracking-tight text-black hover:bg-red-500 hover:text-white active:translate-x-px active:translate-y-px"
        >
          Delete
        </button>
      </div>
    </form>
  );
}
