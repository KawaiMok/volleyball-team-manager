/** 慈青風格主色（註解：取自 org logo JPG）。 */
export const CIQING_BLUE = "#1565c4";
export const CIQING_RED = "#a6192e";

/** 慈青中央圖騰（註解：菱形 + V 形 + 直幹 + 三尖底座）。 */
export function CiqingOrgEmblem({ scale = 1, x = 0, y = 0 }: { scale?: number; x?: number; y?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M0 -13 L5.5 -5.5 L0 -2.5 L-5.5 -5.5 Z"
        fill="#ffffff"
        stroke={CIQING_RED}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M-5.5 -5.5 L0 3 L5.5 -5.5"
        fill="none"
        stroke={CIQING_RED}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M0 3 L0 11" stroke={CIQING_RED} strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M0 11 L-9 17 Q-4 19 0 15 Q4 19 9 17 Z"
        fill="#ffffff"
        stroke={CIQING_RED}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M0 15 L0 21" stroke={CIQING_RED} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

/** 慈青徽章 PNG（註解：裁切版 org logo）。 */
export function CiqingBadgeImage({ size }: { size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 註解：PNG 裁切版 org logo
    <img
      src="/logo/badge.png"
      alt="慈青體育會徽章"
      width={size}
      height={size}
      className="rounded-full object-cover"
      draggable={false}
    />
  );
}

/** 慈青吉祥物 SVG */
export function CiqingMascotSvg({ width, height }: { width: number; height: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 100"
      width={width}
      height={height}
      fill="none"
      aria-hidden
    >
      <ellipse cx="30" cy="94" rx="6" ry="3.5" fill={CIQING_BLUE} />
      <ellipse cx="50" cy="94" rx="6" ry="3.5" fill={CIQING_BLUE} />
      <ellipse cx="12" cy="58" rx="4.5" ry="6" fill={CIQING_BLUE} transform="rotate(-18 12 58)" />
      <ellipse cx="68" cy="58" rx="4.5" ry="6" fill={CIQING_BLUE} transform="rotate(18 68 58)" />
      <circle cx="40" cy="52" r="27" fill={CIQING_BLUE} />
      <path d="M40 27 C30 34 24 43 24 52 C24 61 30 70 40 77" stroke="#ffffff" strokeWidth="2.8" fill="none" />
      <path d="M40 27 C50 34 56 43 56 52 C56 61 50 70 40 77" stroke="#ffffff" strokeWidth="2.8" fill="none" />
      <path d="M15 52 H65" stroke="#ffffff" strokeWidth="2.8" fill="none" />
      <circle cx="33" cy="46" r="2.2" fill="#ffffff" />
      <circle cx="47" cy="46" r="2.2" fill="#ffffff" />
      <path d="M33 56 Q40 61 47 56" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <CiqingOrgEmblem x={40} y={58} scale={0.85} />
    </svg>
  );
}
