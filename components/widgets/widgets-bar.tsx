"use client";

import { useState } from "react";
import { Clock, ListChecks, Smile, X } from "lucide-react";
import { PomodoroWidget } from "@/components/widgets/pomodoro-widget";
import { JokeWidget } from "@/components/widgets/joke-widget";
import { TodoWidget } from "@/components/widgets/todo-widget";
import {
  formatPomodoroTime,
  usePomodoro,
} from "@/components/widgets/pomodoro-context";

export type WidgetId = "pomodoro" | "joke" | "todo";

export const WIDGETS: {
  id: WidgetId;
  label: string;
  title: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "pomodoro",
    label: "pomodoro",
    title: "Pomodoro",
    icon: <Clock className="h-3.5 w-3.5" strokeWidth={3} />,
  },
  {
    id: "joke",
    label: "random joke",
    title: "Random joke",
    icon: <Smile className="h-3.5 w-3.5" strokeWidth={3} />,
  },
  {
    id: "todo",
    label: "to-do",
    title: "To-do",
    icon: <ListChecks className="h-3.5 w-3.5" strokeWidth={3} />,
  },
];

/** Bottom widgets bar — shows only the widgets the user enabled, or nothing. */
export function WidgetsBar({ enabled }: { enabled: WidgetId[] }) {
  const [active, setActive] = useState<WidgetId | null>(null);
  const pomo = usePomodoro();

  if (enabled.length === 0) return null;

  // An open widget that was just disabled closes with it.
  const shown = active && enabled.includes(active) ? active : null;

  const toggle = (id: WidgetId) =>
    setActive((cur) => (cur === id ? null : id));

  return (
    <div className="shrink-0 flex flex-col items-stretch gap-2">
      {shown && (
        <div
          key={shown}
          className="border-2 border-black bg-stone-50 brutal-shadow-sm dark:border-zinc-100 dark:bg-zinc-900"
          style={{
            animation: "widget-slide-up 0.18s ease-out",
          }}
        >
          <div className="flex items-center justify-between border-b-2 border-black bg-yellow-300 px-3 py-1.5 dark:border-zinc-100 dark:text-black">
            <h3 className="text-xs font-black uppercase tracking-tight">
              {WIDGETS.find((w) => w.id === shown)?.title}
            </h3>
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Close widget"
              className="opacity-70 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
          </div>
          <div className="p-3">
            {shown === "pomodoro" && <PomodoroWidget />}
            {shown === "joke" && <JokeWidget />}
            {shown === "todo" && <TodoWidget />}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-stretch gap-1.5 border-2 border-black bg-white p-1.5 brutal-shadow-sm dark:border-zinc-100 dark:bg-zinc-900">
        {WIDGETS.filter((w) => enabled.includes(w.id)).map((w) => (
          <NavButton
            key={w.id}
            label={w.label}
            icon={w.icon}
            active={shown === w.id}
            onClick={() => toggle(w.id)}
            badge={
              w.id !== "pomodoro"
                ? undefined
                : pomo.status === "running"
                ? formatPomodoroTime(pomo.remaining)
                : pomo.status === "done"
                ? "Done!"
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

function NavButton({
  label,
  icon,
  active,
  onClick,
  badge,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-1 min-w-[90px] items-center justify-center gap-1.5 border-2 border-black px-2 py-1.5 text-[11px] font-black uppercase tracking-tight transition-all dark:border-zinc-100 ${
        active
          ? "bg-black text-white brutal-shadow-sm dark:bg-zinc-100 dark:text-black"
          : "bg-white text-black hover:bg-yellow-300 active:translate-x-px active:translate-y-px dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-yellow-300 dark:hover:text-black"
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span className="absolute -top-2 -right-2 border-2 border-black bg-red-500 px-1 py-px font-mono text-[9px] font-bold text-white dark:border-zinc-100">
          {badge}
        </span>
      )}
    </button>
  );
}
