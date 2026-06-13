import type { SportId } from "@/lib/sports/sport-id";

import { DefaultBadgeSvg, DefaultMascotSvg } from "@/components/brand/default-brand-assets";

/** 籃球徽章（註解：橘色球體 + 黑色縫線，toolbar 圓形裁切）。 */
export function BasketballBadgeSvg({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#ea580c" stroke="#0f172a" strokeWidth="2" />
      <circle cx="32" cy="32" r="24" fill="#fb923c" stroke="#9a3412" strokeWidth="1.5" />
      <path
        d="M32 10 C22 18 18 28 18 32 C18 36 22 46 32 54"
        stroke="#431407"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M32 10 C42 18 46 28 46 32 C46 36 42 46 32 54"
        stroke="#431407"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M14 32 H50" stroke="#431407" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path
        d="M32 8 L34 12 L38 12 L35 15 L36 19 L32 17 L28 19 L29 15 L26 12 L30 12 Z"
        fill="#fef3c7"
        stroke="#92400e"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 籃球吉祥物（註解：持球卡通角色，風格對齊排球 mascot）。 */
export function BasketballMascotSvg({ width, height }: { width: number; height: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 96" width={width} height={height} fill="none" aria-hidden>
      <ellipse cx="28" cy="90" rx="7" ry="4" fill="#c2410c" />
      <ellipse cx="52" cy="90" rx="7" ry="4" fill="#c2410c" />
      <ellipse cx="14" cy="58" rx="5" ry="7" fill="#fb923c" transform="rotate(-20 14 58)" />
      <ellipse cx="66" cy="58" rx="5" ry="7" fill="#fb923c" transform="rotate(20 66 58)" />
      <circle cx="40" cy="50" r="28" fill="#fb923c" stroke="#9a3412" strokeWidth="3" />
      <path d="M40 24 C28 32 22 42 22 50 C22 58 28 68 40 76" stroke="#431407" strokeWidth="2.2" fill="none" />
      <path d="M40 24 C52 32 58 42 58 50 C58 58 52 68 40 76" stroke="#431407" strokeWidth="2.2" fill="none" />
      <path d="M16 50 H64" stroke="#431407" strokeWidth="2.2" fill="none" />
      <circle cx="32" cy="46" r="2.5" fill="#431407" />
      <circle cx="48" cy="46" r="2.5" fill="#431407" />
      <path d="M32 56 Q40 62 48 56" stroke="#431407" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="62" cy="34" r="11" fill="#fb923c" stroke="#9a3412" strokeWidth="2" />
      <path d="M56 30 C58 34 62 36 66 34" stroke="#431407" strokeWidth="1.6" fill="none" />
      <path d="M58 38 C60 42 64 42 66 38" stroke="#431407" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

const SOCCER_INK = "#171717";

/**
 * Telstar 經典足球圖案（註解：黑白五邊形＋六邊形縫線，對齊參考圖）。
 * viewBox 固定 100×100，可用 transform 縮放嵌入徽章／吉祥物。
 */
function SoccerTelstarBallGraphic({ clipId }: { clipId: string }) {
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <circle cx="50" cy="50" r="48" fill="#ffffff" />
        {/* 黑色五邊形面板 */}
        <path fill={SOCCER_INK} d="M50 49 L55.6 52.4 L54 58.8 L46 58.8 L44.4 52.4 Z" />
        <path fill={SOCCER_INK} d="M27.5 29.5 L32.8 25 L39 27.5 L37.5 34 L29 35 Z" />
        <path fill={SOCCER_INK} d="M72.5 29.5 L67.2 25 L61 27.5 L62.5 34 L71 35 Z" />
        <path fill={SOCCER_INK} d="M3.5 48 L10.5 43 L16.5 48 L14 56.5 L6.5 57.5 Z" />
        <path fill={SOCCER_INK} d="M96.5 48 L89.5 43 L83.5 48 L86 56.5 L93.5 57.5 Z" />
        {/* 白色六邊形縫線 */}
        <g fill="none" stroke={SOCCER_INK} strokeWidth="1.05" strokeLinejoin="round" strokeLinecap="round">
          <path d="M32.8 25 Q50 17.5 67.2 25" />
          <path d="M39 27.5 L50 33 L61 27.5" />
          <path d="M39 27.5 L46.5 42 L53.5 42 L61 27.5" />
          <path d="M50 49 L50.5 38 L46.5 42" />
          <path d="M50 49 L50.5 38 L53.5 42" />
          <path d="M37.5 34 L44.4 52.4 L55.6 52.4 L62.5 34" />
          <path d="M44.4 52.4 L16.5 48 L29 35" />
          <path d="M55.6 52.4 L83.5 48 L71 35" />
          <path d="M10.5 43 Q22 36 44.4 52.4" />
          <path d="M89.5 43 Q78 36 55.6 52.4" />
          <path d="M46 58.8 Q36 70 14 56.5" />
          <path d="M54 58.8 Q64 70 86 56.5" />
        </g>
      </g>
      <circle cx="50" cy="50" r="48" fill="none" stroke={SOCCER_INK} strokeWidth="1.4" />
    </>
  );
}

/** 足球徽章（註解：綠色外圈 + Telstar 黑白足球）。 */
export function SoccerBadgeSvg({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#15803d" stroke="#0f172a" strokeWidth="2" />
      <g transform="translate(32 32) scale(0.46) translate(-50 -50)">
        <SoccerTelstarBallGraphic clipId="soccer-badge-telstar-clip" />
      </g>
    </svg>
  );
}

/** 足球吉祥物（註解：Telstar 球身 + 腳下足球，風格對齊排球 mascot）。 */
export function SoccerMascotSvg({ width, height }: { width: number; height: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 96" width={width} height={height} fill="none" aria-hidden>
      <ellipse cx="28" cy="90" rx="7" ry="4" fill="#15803d" />
      <ellipse cx="52" cy="90" rx="7" ry="4" fill="#15803d" />
      <ellipse cx="14" cy="58" rx="5" ry="7" fill="#4ade80" transform="rotate(-20 14 58)" />
      <ellipse cx="66" cy="58" rx="5" ry="7" fill="#4ade80" transform="rotate(20 66 58)" />
      <circle cx="40" cy="50" r="28" fill="#ffffff" stroke="#15803d" strokeWidth="3" />
      <g transform="translate(40 50) scale(0.52) translate(-50 -50)">
        <SoccerTelstarBallGraphic clipId="soccer-mascot-body-telstar-clip" />
      </g>
      <circle cx="32" cy="54" r="2.5" fill="#15803d" />
      <circle cx="48" cy="54" r="2.5" fill="#15803d" />
      <path d="M32 62 Q40 68 48 62" stroke="#15803d" strokeWidth="2" fill="none" strokeLinecap="round" />
      <g transform="translate(62 78) scale(0.2) translate(-50 -50)">
        <SoccerTelstarBallGraphic clipId="soccer-mascot-football-telstar-clip" />
      </g>
    </svg>
  );
}

type BadgeProps = { sport: SportId; size: number };
type MascotProps = { sport: SportId; width: number; height: number };

/** 依運動類型回傳徽章 SVG（註解：排球沿用既有 default 資產）。 */
export function SportBadgeSvg({ sport, size }: BadgeProps) {
  switch (sport) {
    case "BASKETBALL":
      return <BasketballBadgeSvg size={size} />;
    case "SOCCER":
      return <SoccerBadgeSvg size={size} />;
    default:
      return <DefaultBadgeSvg size={size} />;
  }
}

/** 依運動類型回傳吉祥物 SVG */
export function SportMascotSvg({ sport, width, height }: MascotProps) {
  switch (sport) {
    case "BASKETBALL":
      return <BasketballMascotSvg width={width} height={height} />;
    case "SOCCER":
      return <SoccerMascotSvg width={width} height={height} />;
    default:
      return <DefaultMascotSvg width={width} height={height} />;
  }
}
