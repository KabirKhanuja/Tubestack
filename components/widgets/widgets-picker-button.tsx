"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FAB_CLASS } from "@/components/fab";
import { WIDGETS, type WidgetId } from "@/components/widgets/widgets-bar";

type Props = {
  enabled: WidgetId[];
  onChange: (enabled: WidgetId[]) => void;
};

/** Floating button with checkboxes choosing which widgets show in the bar. */
export function WidgetsPickerButton({ enabled, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape while open.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // Keep the page's Escape handler from also deselecting the video.
      e.stopPropagation();
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(id: WidgetId, on: boolean) {
    const rest = enabled.filter((x) => x !== id);
    onChange(on ? [...rest, id] : rest);
  }

  return (
    <div ref={rootRef} className="relative">
      {open && (
        <div
          className="absolute bottom-full right-0 mb-3 w-52 border-[3px] border-black bg-white shadow-[3px_3px_0_0_#000] dark:border-zinc-100 dark:bg-zinc-900 dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.9)]"
          style={{ animation: "widget-slide-up 0.18s ease-out" }}
        >
          <div className="border-b-[3px] border-black bg-yellow-300 px-3 py-1.5 text-xs font-black uppercase tracking-tight text-black dark:border-zinc-100">
            Widgets
          </div>
          <div className="flex flex-col p-1.5">
            {WIDGETS.map((w) => (
              <label
                key={w.id}
                className="flex cursor-pointer items-center gap-2 px-1.5 py-1.5 text-[11px] font-black uppercase tracking-tight hover:bg-yellow-300 dark:hover:text-black"
              >
                <Checkbox
                  checked={enabled.includes(w.id)}
                  onCheckedChange={(c) => toggle(w.id, c === true)}
                  className="border-2 border-black dark:border-zinc-100"
                />
                {w.icon}
                <span>{w.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Widgets"
        aria-expanded={open}
        title="Widgets"
        className={FAB_CLASS}
      >
        <LayoutGrid className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
