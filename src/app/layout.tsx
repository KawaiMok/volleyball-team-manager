import { Suspense } from "react";

import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";

import { CapacitorNativeBridge } from "@/components/capacitor-native-bridge";
import { CapacitorPushBridge } from "@/components/capacitor-push-bridge";
import { NavigationTransitionBar } from "@/components/navigation-transition-bar";
import { ThemeProvider } from "@/components/theme-provider";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { ToastProvider } from "@/components/toast-provider";
import { THEME_STORAGE_KEY } from "@/lib/theme-preference";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "排球隊管理",
  description: "Volleyball team manager — MVP",
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="zh-Hant"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        {/** 註解：在 React 注水前套用 localStorage 主題，避免閃爍 */}
        <Script
          id="theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var r=document.documentElement;var s=localStorage.getItem(k);var m=window.matchMedia("(prefers-color-scheme: dark)");var d=s==="dark"||(s!=="light"&&(!s||s==="system")&&m.matches);r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`,
          }}
        />
        <body className="flex min-h-full flex-col">
          <Suspense fallback={null}>
            <NavigationTransitionBar />
          </Suspense>
          <Suspense fallback={null}>
            <CapacitorPushBridge />
          </Suspense>
          <CapacitorNativeBridge />
          <ThemeProvider>
            <ToastProvider>
              {children}
              <ScrollToTopButton />
            </ToastProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
