"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Soft fallback for islands rendered outside the provider.
    return async (opts) => window.confirm(opts.message);
  }
  return ctx;
}

type State = {
  open: boolean;
  options: ConfirmOptions;
};

const INITIAL: State = {
  open: false,
  options: { message: "" },
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(INITIAL);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({ open: true, options });
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setState((s) => ({ ...s, open: false }));
    resolver?.(value);
  }, []);

  const { open, options } = state;
  const title = options.title ?? "Are you sure?";
  const confirmText = options.confirmText ?? "Confirm";
  const cancelText = options.cancelText ?? "Cancel";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) settle(false);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] overflow-hidden border-[3px] border-black bg-white p-0 sm:max-w-md dark:border-zinc-100 dark:bg-zinc-900"
          style={{ boxShadow: "5px 5px 0 0 #000", borderRadius: 0 }}
        >
          <DialogHeader className="border-b-[3px] border-black bg-yellow-300 px-4 py-2 dark:border-zinc-100 dark:text-black">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-base font-black uppercase tracking-tight">
                {title}
              </DialogTitle>
              <button
                type="button"
                onClick={() => settle(false)}
                aria-label="Close"
                className="shrink-0 opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
            <DialogDescription className="sr-only">
              Confirmation dialog
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 p-4">
            <p className="text-sm font-bold uppercase leading-snug tracking-tight">
              {options.message}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => settle(false)}
                className="h-10 flex-1 border-[3px] border-black bg-white text-xs font-black uppercase tracking-tight text-black hover:bg-stone-200 active:translate-x-px active:translate-y-px dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
                style={{ boxShadow: "4px 4px 0 0 #000", borderRadius: 0 }}
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => settle(true)}
                autoFocus
                className="h-10 flex-1 border-[3px] border-black bg-black text-xs font-black uppercase tracking-tight text-white hover:bg-zinc-800 active:translate-x-px active:translate-y-px active:shadow-none dark:border-zinc-100 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
                style={{ boxShadow: "4px 4px 0 0 #000", borderRadius: 0 }}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
