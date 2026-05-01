"use client";

import { useEffect, useState } from "react";
import { Layers } from "lucide-react";

const TOTAL_MS = 2000;

export function SplashScreen() {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setMounted(false), TOTAL_MS);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-stone-100 dark:bg-zinc-950"
      style={{
        animation: `tubestack-splash-fade ${TOTAL_MS}ms ease-in-out forwards`,
      }}
    >
      <div
        className="flex flex-col items-center gap-3"
        style={{
          animation: `tubestack-splash-pop ${TOTAL_MS}ms ease-out forwards`,
        }}
      >
        <div className="grid h-16 w-16 place-items-center border-2 border-black bg-yellow-300 brutal-shadow dark:border-zinc-100 dark:text-black">
          <Layers className="h-8 w-8" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight">
          Welcome to <span className="text-red-600">TubeStack</span>
        </h1>
        <span className="font-mono text-[10px] font-bold uppercase opacity-50">
          Loading…
        </span>
      </div>
    </div>
  );
}
