"use client";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SplashScreen } from "@/components/splash-screen";
import { ConfirmProvider } from "@/components/confirm-modal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ConfirmProvider>
        <SplashScreen />
        {children}
        <Toaster position="bottom-right" />
      </ConfirmProvider>
    </ThemeProvider>
  );
}
