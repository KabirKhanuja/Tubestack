"use client";

import { useCallback, useRef } from "react";

type Props = {
  /** Reports the pointer's absolute clientY while dragging. */
  onDrag: (clientY: number) => void;
  onCommit?: () => void;
  ariaLabel?: string;
};

/** A horizontal (row-resize) divider — the vertical-drag sibling of Resizer. */
export function HorizontalResizer({
  onDrag,
  onCommit,
  ariaLabel = "Resize panel",
}: Props) {
  const draggingRef = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      onDrag(e.clientY);
    },
    [onDrag]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      onCommit?.();
    },
    [onCommit]
  );

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="group relative z-10 h-1 shrink-0 cursor-row-resize bg-black transition-colors hover:bg-red-500 dark:bg-zinc-100"
    >
      {/* Hit area expander */}
      <div className="absolute inset-x-0 -top-1.5 -bottom-1.5" aria-hidden />

      {/* Visual handle indicator */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-7 -translate-x-1/2 -translate-y-1/2 border-2 border-black bg-white opacity-80 transition-opacity group-hover:opacity-100 dark:border-zinc-100 dark:bg-zinc-950"
      />
    </div>
  );
}
