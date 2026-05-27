/** 預設風格：通用排球徽章（註解：對應 public/logo/badge.svg）。 */
export function DefaultBadgeSvg({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-hidden
    >
      <circle cx="32" cy="32" r="30" fill="#1e40af" stroke="#0f172a" strokeWidth="2" />
      <circle cx="32" cy="32" r="24" fill="#ffffff" />
      <path d="M32 10 C22 18 18 28 18 32 C18 36 22 46 32 54" stroke="#1e40af" strokeWidth="2.5" fill="none" />
      <path d="M32 10 C42 18 46 28 46 32 C46 36 42 46 32 54" stroke="#1e40af" strokeWidth="2.5" fill="none" />
      <path d="M14 32 H50" stroke="#1e40af" strokeWidth="2.5" fill="none" />
      <path
        d="M32 18 L36 26 L32 34 L28 26 Z"
        fill="#ffffff"
        stroke="#dc2626"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M32 34 L24 40 L20 36 L28 30 Z"
        fill="#ffffff"
        stroke="#dc2626"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M32 34 L40 40 L44 36 L36 30 Z"
        fill="#ffffff"
        stroke="#dc2626"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M32 38 L26 46 L30 48 L32 44 L34 48 L38 46 Z"
        fill="#ffffff"
        stroke="#dc2626"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 預設風格：通用排球吉祥物（註解：對應 public/logo/mascot.svg）。 */
export function DefaultMascotSvg({ width, height }: { width: number; height: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 96"
      width={width}
      height={height}
      fill="none"
      aria-hidden
    >
      <ellipse cx="28" cy="90" rx="7" ry="4" fill="#1e40af" />
      <ellipse cx="52" cy="90" rx="7" ry="4" fill="#1e40af" />
      <ellipse cx="14" cy="58" rx="5" ry="7" fill="#3b82f6" transform="rotate(-20 14 58)" />
      <ellipse cx="66" cy="58" rx="5" ry="7" fill="#3b82f6" transform="rotate(20 66 58)" />
      <circle cx="40" cy="50" r="28" fill="#ffffff" stroke="#1e40af" strokeWidth="3" />
      <path d="M40 24 C28 32 22 42 22 50 C22 58 28 68 40 76" stroke="#1e40af" strokeWidth="2.5" fill="none" />
      <path d="M40 24 C52 32 58 42 58 50 C58 58 52 68 40 76" stroke="#1e40af" strokeWidth="2.5" fill="none" />
      <path d="M16 50 H64" stroke="#1e40af" strokeWidth="2.5" fill="none" />
      <circle cx="32" cy="46" r="2.5" fill="#1e40af" />
      <circle cx="48" cy="46" r="2.5" fill="#1e40af" />
      <path d="M32 56 Q40 62 48 56" stroke="#1e40af" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="52" r="10" fill="#1e40af" />
      <path d="M40 46 L43 51 L40 56 L37 51 Z" fill="#ffffff" stroke="#dc2626" strokeWidth="1" strokeLinejoin="round" />
      <path
        d="M40 56 L35 59 L37 61 L40 58 L43 61 L45 59 Z"
        fill="#ffffff"
        stroke="#dc2626"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
