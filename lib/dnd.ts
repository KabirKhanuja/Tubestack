"use client";

import { useCallback, useState } from "react";

export type DragHandlers = {
  draggingId: string | null;
  overId: string | null;
  onDragStart: (id: string) => (e: React.DragEvent) => void;
  onDragOver: (id: string) => (e: React.DragEvent) => void;
  onDragLeave: (id: string) => (e: React.DragEvent) => void;
  onDrop: (id: string) => (e: React.DragEvent) => void;
  onDragEnd: () => void;
};

export function useDragReorder(onReorder: (fromId: string, toId: string) => void): DragHandlers {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const onDragStart = useCallback(
    (id: string) => (e: React.DragEvent) => {
      setDraggingId(id);
      e.dataTransfer.effectAllowed = "move";
      try {
        e.dataTransfer.setData("text/plain", id);
      } catch {
        // some browsers throw in test envs
      }
    },
    []
  );

  const onDragOver = useCallback(
    (id: string) => (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setOverId(id);
    },
    []
  );

  const onDragLeave = useCallback(
    (id: string) => () => {
      setOverId((cur) => (cur === id ? null : cur));
    },
    []
  );

  const onDrop = useCallback(
    (id: string) => (e: React.DragEvent) => {
      e.preventDefault();
      const from = draggingId ?? e.dataTransfer.getData("text/plain");
      if (from && from !== id) onReorder(from, id);
      setDraggingId(null);
      setOverId(null);
    },
    [draggingId, onReorder]
  );

  const onDragEnd = useCallback(() => {
    setDraggingId(null);
    setOverId(null);
  }, []);

  return {
    draggingId,
    overId,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
  };
}

export function reorder<T>(items: T[], fromId: string, toId: string, getId: (t: T) => string): T[] {
  const fromIdx = items.findIndex((i) => getId(i) === fromId);
  const toIdx = items.findIndex((i) => getId(i) === toId);
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return items;
  const next = items.slice();
  const [moved] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, moved);
  return next;
}
