"use client";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SplashScreen } from "@/components/splash-screen";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SplashScreen />
      {children}
      <Toaster richColors position="bottom-right" />
    </ThemeProvider>
  );
}
