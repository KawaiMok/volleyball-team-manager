type AppLogoProps = {
  /** 徽章（toolbar）或吉祥物（hero / loading） */
  variant?: "badge" | "mascot";
  size?: number;
  className?: string;
  /** mascot 彈跳動畫（註解：loading 用） */
  animated?: boolean;
};

/** 團徽主色（註解：取自 org logo JPG） */
const BRAND_BLUE = "#1565c4";
const BRAND_RED = "#a6192e";

/**
 * 中央圖騰（註解：菱形 + V 形 + 直幹 + 三尖底座；對應 org logo 白圖紅邊）。
 */
function OrgEmblem({ scale = 1, x = 0, y = 0 }: { scale?: number; x?: number; y?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M0 -13 L5.5 -5.5 L0 -2.5 L-5.5 -5.5 Z"
        fill="#ffffff"
        stroke={BRAND_RED}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M-5.5 -5.5 L0 3 L5.5 -5.5"
        fill="none"
        stroke={BRAND_RED}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M0 3 L0 11"
        stroke={BRAND_RED}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M0 11 L-9 17 Q-4 19 0 15 Q4 19 9 17 Z"
        fill="#ffffff"
        stroke={BRAND_RED}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M0 15 L0 21"
        stroke={BRAND_RED}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </g>
  );
}

/** 直接使用 org logo 裁切（無環上文字） */
function BadgeImage({ size }: { size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 註解：PNG 裁切版 org logo，避免 SVG 失真
    <img
      src="/logo/badge.png"
      alt="慧青體育會徽章"
      width={size}
      height={size}
      className="rounded-full object-cover"
      draggable={false}
    />
  );
}

/** 以 org logo 圖騰 + 排球面為基礎的吉祥物 */
function MascotSvg({ width, height }: { width: number; height: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 100"
      width={width}
      height={height}
      fill="none"
      aria-hidden
    >
      {/* 腳 */}
      <ellipse cx="30" cy="94" rx="6" ry="3.5" fill={BRAND_BLUE} />
      <ellipse cx="50" cy="94" rx="6" ry="3.5" fill={BRAND_BLUE} />
      {/* 手 */}
      <ellipse cx="12" cy="58" rx="4.5" ry="6" fill={BRAND_BLUE} transform="rotate(-18 12 58)" />
      <ellipse cx="68" cy="58" rx="4.5" ry="6" fill={BRAND_BLUE} transform="rotate(18 68 58)" />
      {/* 排球身體（藍底 + 白線，同 org logo 內圈） */}
      <circle cx="40" cy="52" r="27" fill={BRAND_BLUE} />
      <path d="M40 27 C30 34 24 43 24 52 C24 61 30 70 40 77" stroke="#ffffff" strokeWidth="2.8" fill="none" />
      <path d="M40 27 C50 34 56 43 56 52 C56 61 50 70 40 77" stroke="#ffffff" strokeWidth="2.8" fill="none" />
      <path d="M15 52 H65" stroke="#ffffff" strokeWidth="2.8" fill="none" />
      {/* 笑臉 */}
      <circle cx="33" cy="46" r="2.2" fill="#ffffff" />
      <circle cx="47" cy="46" r="2.2" fill="#ffffff" />
      <path d="M33 56 Q40 61 47 56" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* 胸前 org 圖騰 */}
      <OrgEmblem x={40} y={58} scale={0.85} />
    </svg>
  );
}

/**
 * 慧青體育會品牌 Logo（註解：badge 用 org logo 裁切 PNG；mascot 依同圖騰設計）。
 */
export function AppLogo({ variant = "badge", size = 40, className = "", animated = false }: AppLogoProps) {
  const animClass = animated ? "logo-bounce" : "";
  const label = variant === "mascot" ? "排球隊管理吉祥物" : "慧青體育會徽章";

  if (variant === "mascot") {
    const h = Math.round(size * 1.25);
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center ${animClass} ${className}`.trim()}
        role="img"
        aria-label={label}
      >
        <MascotSvg width={size} height={h} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${animClass} ${className}`.trim()}
      role="img"
      aria-label={label}
    >
      <BadgeImage size={size} />
    </span>
  );
}
