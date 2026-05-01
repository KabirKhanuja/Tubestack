import type { Metadata } from "next";
import Script from "next/script";
import { Poppins, Courier_Prime } from "next/font/google";
import { Providers } from "@/components/providers";
import { themeInitScript } from "@/components/theme-provider";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const courier = Courier_Prime({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "TUBESTACK",
  description: "Distraction-free YouTube video manager.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} ${courier.variable} h-full antialiased`}
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-stone-100 text-black dark:bg-zinc-950 dark:text-zinc-100"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
