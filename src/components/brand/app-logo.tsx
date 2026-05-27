"use client";

import { useBrandStyle } from "@/components/brand/brand-style-provider";
import { CiqingBadgeImage, CiqingMascotSvg } from "@/components/brand/ciqing-brand-assets";
import { DefaultBadgeSvg, DefaultMascotSvg } from "@/components/brand/default-brand-assets";
import { BRAND_STYLE_LABELS, type BrandStyleId } from "@/lib/brand-style";

type AppLogoProps = {
  /** 徽章（toolbar）或吉祥物（hero / loading / avatar） */
  variant?: "badge" | "mascot";
  size?: number;
  className?: string;
  /** mascot 彈跳動畫（註解：loading 用） */
  animated?: boolean;
  /** 覆寫風格（註解：Server Component 傳入；client 預設讀 context）。 */
  style?: BrandStyleId;
};

/**
 * Logo／Avatar 元件（註解：`default` 預設通用排球；`ciqing` 慈青體育會）。
 */
export function AppLogo({
  variant = "badge",
  size = 40,
  className = "",
  animated = false,
  style: styleProp,
}: AppLogoProps) {
  const { style: ctxStyle } = useBrandStyle();
  const style = styleProp ?? ctxStyle;
  const animClass = animated ? "logo-bounce" : "";
  const styleLabel = BRAND_STYLE_LABELS[style];
  const label =
    variant === "mascot" ? `${styleLabel}排球吉祥物` : `${styleLabel}徽章`;

  if (variant === "mascot") {
    const h = Math.round(size * 1.25);
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center ${animClass} ${className}`.trim()}
        role="img"
        aria-label={label}
      >
        {style === "ciqing" ?
          <CiqingMascotSvg width={size} height={h} />
        : <DefaultMascotSvg width={size} height={Math.round(size * 1.2)} />}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${animClass} ${className}`.trim()}
      role="img"
      aria-label={label}
    >
      {style === "ciqing" ?
        <CiqingBadgeImage size={size} />
      : <DefaultBadgeSvg size={size} />}
    </span>
  );
}
