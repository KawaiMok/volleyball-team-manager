"use client";

import { useBrandStyle } from "@/components/brand/brand-style-provider";
import { CiqingBadgeImage, CiqingMascotSvg } from "@/components/brand/ciqing-brand-assets";
import { SportBadgeSvg, SportMascotSvg } from "@/components/brand/sport-brand-assets";
import { useOptionalTeamSportId } from "@/components/team-sport-provider";
import { BRAND_STYLE_LABELS, type BrandStyleId } from "@/lib/brand-style";
import { getSportModule } from "@/lib/sports/registry";
import type { SportId } from "@/lib/sports/sport-id";

type AppLogoProps = {
  /** 徽章（toolbar）或吉祥物（hero / loading / avatar） */
  variant?: "badge" | "mascot";
  size?: number;
  className?: string;
  /** mascot 彈跳動畫（註解：loading 用） */
  animated?: boolean;
  /** 覆寫風格（註解：Server Component 傳入；client 預設讀 context）。 */
  style?: BrandStyleId;
  /** 覆寫運動（註解：未傳則讀 TeamSportProvider；皆無則用慈青或排球預設）。 */
  sport?: SportId;
};

/**
 * Logo／Avatar 元件（註解：排球＝慈青第一版；籃球／足球＝運動專屬圖示）。
 */
export function AppLogo({
  variant = "badge",
  size = 40,
  className = "",
  animated = false,
  style: styleProp,
  sport: sportProp,
}: AppLogoProps) {
  const { style: ctxStyle } = useBrandStyle();
  const style = styleProp ?? ctxStyle;
  const teamSport = useOptionalTeamSportId();
  const sport: SportId = sportProp ?? teamSport ?? "VOLLEYBALL";
  /** 排球維持慈青第一版；籃球／足球才用運動專屬圖示 */
  const useSportBranding = sport === "BASKETBALL" || sport === "SOCCER";
  const useCiqing = style === "ciqing" && !useSportBranding;
  const sportName = getSportModule(sport).labels.name;
  const styleLabel = BRAND_STYLE_LABELS[style];
  const label =
    variant === "mascot" ?
      useCiqing ? `${styleLabel}排球吉祥物` : `${sportName}吉祥物`
    : useCiqing ? `${styleLabel}徽章` : `${sportName}徽章`;

  if (variant === "mascot") {
    const h = Math.round(size * 1.25);
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center ${animated ? "logo-bounce" : ""} ${className}`.trim()}
        role="img"
        aria-label={label}
      >
        {useCiqing ?
          <CiqingMascotSvg width={size} height={h} />
        : <SportMascotSvg sport={sport} width={size} height={Math.round(size * 1.2)} />}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${animated ? "logo-bounce" : ""} ${className}`.trim()}
      role="img"
      aria-label={label}
    >
      {useCiqing ?
        <CiqingBadgeImage size={size} />
      : <SportBadgeSvg sport={sport} size={size} />}
    </span>
  );
}
