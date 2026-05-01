"use client";

import { useCallback, useRef } from "react";

type Props = {
  onDrag: (deltaX: number) => void;
  onCommit?: () => void;
  ariaLabel?: string;
};

export function Resizer({ onDrag, onCommit, ariaLabel = "Resize panel" }: Props) {
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    draggingRef.current = true;
    lastXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;
      if (dx !== 0) onDrag(dx);
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
      aria-orientation="vertical"
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative z-10 w-0.5 shrink-0 cursor-col-resize bg-black/80 transition-colors hover:bg-red-500 dark:bg-zinc-100/80"
    >
      {/* Hit area expander */}
      <div className="absolute inset-y-0 -left-1.5 -right-1.5" aria-hidden />
    </div>
  );
}
