import { Suspense } from "react";

import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";

import { CapacitorNativeBridge } from "@/components/capacitor-native-bridge";
import { CapacitorPushBridge } from "@/components/capacitor-push-bridge";
import { BrandStyleProvider } from "@/components/brand/brand-style-provider";
import { DataViewModeProvider } from "@/components/data-view-mode-provider";
import { NavigationTransitionBar } from "@/components/navigation-transition-bar";
import { ThemeProvider } from "@/components/theme-provider";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { ToastProvider } from "@/components/toast-provider";
import { BRAND_STYLE_STORAGE_KEY } from "@/lib/brand-style";
import { brandStyleBootScript } from "@/lib/brand-style-preference";
import { getBrandStyleForRequest } from "@/lib/brand-style-server";
import { THEME_STORAGE_KEY, themeBootScript } from "@/lib/theme-preference";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brandStyle = await getBrandStyleForRequest();

  return (
    <ClerkProvider>
      <html
        lang="zh-Hant"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        data-brand-style={brandStyle}
        suppressHydrationWarning
      >
        {/** 註解：在 React 注水前套用 localStorage 主題與 Logo 風格 */}
        <Script
          id="theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: themeBootScript(THEME_STORAGE_KEY),
          }}
        />
        <Script
          id="brand-style-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: brandStyleBootScript(BRAND_STYLE_STORAGE_KEY),
          }}
        />
        <body className="flex min-h-full flex-col">
          <Suspense fallback={null}>
            <NavigationTransitionBar />
          </Suspense>
          <Suspense fallback={null}>
            <CapacitorPushBridge />
          </Suspense>
          <BrandStyleProvider initialStyle={brandStyle}>
            <DataViewModeProvider>
              <ThemeProvider>
                <ToastProvider>
                  <CapacitorNativeBridge />
                  {children}
                  <ScrollToTopButton />
                </ToastProvider>
              </ThemeProvider>
            </DataViewModeProvider>
          </BrandStyleProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
