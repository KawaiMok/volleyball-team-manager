"use client";

/** 底 Tab 用 mascot 動作圖（註解：隨 Logo 風格切換預設／慈青）。 */
import type { ComponentType, ReactNode } from "react";

import { useBrandStyle } from "@/components/brand/brand-style-provider";
import type { BrandStyleId } from "@/lib/brand-style";

export type MascotTabAction =
  | "home"
  | "schedule"
  | "events"
  | "calendar"
  | "team"
  | "notify"
  | "feedback";

type Palette = { blue: string; red: string; bodyFill: string; lineStroke: string };

function paletteFor(style: BrandStyleId): Palette {
  if (style === "ciqing") {
    return { blue: "#1565c4", red: "#a6192e", bodyFill: "#1565c4", lineStroke: "#ffffff" };
  }
  return { blue: "#1e40af", red: "#dc2626", bodyFill: "#ffffff", lineStroke: "#1e40af" };
}

/** 排球身體 + 笑臉 */
function MascotBody({
  palette,
  cx = 24,
  cy = 26,
  r = 17,
}: {
  palette: Palette;
  cx?: number;
  cy?: number;
  r?: number;
}) {
  const eye = palette.bodyFill === "#ffffff" ? palette.blue : "#fff";
  const mouth = palette.bodyFill === "#ffffff" ? palette.blue : "#fff";
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={palette.bodyFill} stroke={palette.blue} strokeWidth={styleStroke(palette)} />
      <path
        d={`M${cx} ${cy - r + 4} C${cx - 8} ${cy - 6} ${cx - r + 2} ${cy + 2} ${cx - r + 2} ${cy + 4}`}
        stroke={palette.lineStroke}
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d={`M${cx} ${cy - r + 4} C${cx + 8} ${cy - 6} ${cx + r - 2} ${cy + 2} ${cx + r - 2} ${cy + 4}`}
        stroke={palette.lineStroke}
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d={`M${cx - r + 3} ${cy + 2} H${cx + r - 3}`}
        stroke={palette.lineStroke}
        strokeWidth="1.8"
        fill="none"
      />
      <circle cx={cx - 5} cy={cy - 2} r="1.8" fill={eye} />
      <circle cx={cx + 5} cy={cy - 2} r="1.8" fill={eye} />
      <path
        d={`M${cx - 5} ${cy + 5} Q${cx} ${cy + 9} ${cx + 5} ${cy + 5}`}
        stroke={mouth}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </>
  );
}

function styleStroke(p: Palette) {
  return p.bodyFill === "#ffffff" ? 2 : 0;
}

/** 慈青胸前小圖騰 */
function MiniEmblem({ palette, cx = 24, cy = 30 }: { palette: Palette; cx?: number; cy?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(0.45)`}>
      <path d="M0 -8 L4 -2 L0 1 L-4 -2 Z" fill="#fff" stroke={palette.red} strokeWidth="1.2" />
      <path d="M0 1 L0 7" stroke={palette.red} strokeWidth="1.2" />
    </g>
  );
}

/** 預設風格胸前小菱形 */
function MiniDefaultMark({ palette, cx = 24, cy = 30 }: { palette: Palette; cx?: number; cy?: number }) {
  return (
    <path
      d={`M${cx} ${cy - 4} L${cx + 3} ${cy} L${cx} ${cy + 4} L${cx - 3} ${cy} Z`}
      fill="#fff"
      stroke={palette.red}
      strokeWidth="1"
    />
  );
}

type IconProps = {
  size?: number;
  active?: boolean;
  className?: string;
  palette: Palette;
  style: BrandStyleId;
};

function TabSvg({
  size = 24,
  active = false,
  className = "",
  children,
}: Omit<IconProps, "palette" | "style"> & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className={`${active ? "opacity-100" : "opacity-55"} ${className}`.trim()}
    >
      {children}
    </svg>
  );
}

function ChestMark({ palette, style, cx, cy }: { palette: Palette; style: BrandStyleId; cx?: number; cy?: number }) {
  return style === "ciqing" ?
      <MiniEmblem palette={palette} cx={cx} cy={cy} />
    : <MiniDefaultMark palette={palette} cx={cx} cy={cy} />;
}

export function MascotHomeIcon({ size = 24, active, className, palette, style }: IconProps) {
  return (
    <TabSvg size={size} active={active} className={className}>
      <ellipse cx="14" cy="28" rx="3.5" ry="5" fill={palette.blue} transform="rotate(-35 14 28)" />
      <ellipse cx="36" cy="20" rx="3" ry="4.5" fill={palette.blue} transform="rotate(25 36 20)" />
      <MascotBody palette={palette} />
      <ChestMark palette={palette} style={style} />
    </TabSvg>
  );
}

export function MascotScheduleIcon({ size = 24, active, className, palette, style }: IconProps) {
  return (
    <TabSvg size={size} active={active} className={className}>
      <MascotBody palette={palette} />
      <ChestMark palette={palette} style={style} />
      <path d="M34 14 V32" stroke={palette.blue} strokeWidth="2" strokeLinecap="round" />
      <path d="M34 14 L40 16 L34 18 Z" fill={palette.red} />
    </TabSvg>
  );
}

export function MascotEventsIcon({ size = 24, active, className, palette }: IconProps) {
  return (
    <TabSvg size={size} active={active} className={className}>
      <MascotBody palette={palette} cy={27} />
      <rect x="30" y="10" width="14" height="18" rx="2" fill="#fff" stroke={palette.blue} strokeWidth="1.5" />
      <path d="M33 16 H41 M33 20 H41 M33 24 H38" stroke={palette.blue} strokeWidth="1.2" strokeLinecap="round" />
    </TabSvg>
  );
}

export function MascotCalendarIcon({ size = 24, active, className, palette }: IconProps) {
  return (
    <TabSvg size={size} active={active} className={className}>
      <rect x="14" y="6" width="20" height="16" rx="2" fill="#fff" stroke={palette.blue} strokeWidth="1.5" />
      <path d="M14 11 H34" stroke={palette.blue} strokeWidth="1.2" />
      <circle cx="20" cy="16" r="1.5" fill={palette.red} />
      <circle cx="24" cy="16" r="1.5" fill={palette.blue} />
      <circle cx="28" cy="16" r="1.5" fill={palette.blue} />
      <MascotBody palette={palette} cy={30} r={15} />
      <circle cx="19" cy="28" r="1.4" fill={palette.bodyFill === "#ffffff" ? palette.blue : "#fff"} />
      <circle cx="29" cy="28" r="1.4" fill={palette.bodyFill === "#ffffff" ? palette.blue : "#fff"} />
    </TabSvg>
  );
}

export function MascotTeamIcon({ size = 24, active, className, palette, style }: IconProps) {
  return (
    <TabSvg size={size} active={active} className={className}>
      <circle cx="14" cy="30" r="9" fill={palette.blue} opacity="0.85" />
      <circle cx="34" cy="30" r="9" fill={palette.blue} opacity="0.85" />
      <MascotBody palette={palette} cy={24} r={14} />
      <ChestMark palette={palette} style={style} cy={28} />
    </TabSvg>
  );
}

export function MascotNotifyIcon({ size = 24, active, className, palette, style }: IconProps) {
  return (
    <TabSvg size={size} active={active} className={className}>
      <ellipse cx="36" cy="14" rx="3" ry="4.5" fill={palette.blue} transform="rotate(20 36 14)" />
      <MascotBody palette={palette} />
      <ChestMark palette={palette} style={style} />
      <path
        d="M32 8 C32 5 36 4 38 7 L38 14 C38 16 36 17 34 17"
        stroke={palette.red}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="34" cy="18" r="1.2" fill={palette.red} />
    </TabSvg>
  );
}

export function MascotFeedbackIcon({ size = 24, active, className, palette, style }: IconProps) {
  return (
    <TabSvg size={size} active={active} className={className}>
      <ellipse cx="36" cy="22" rx="4" ry="5.5" fill={palette.blue} transform="rotate(15 36 22)" />
      <MascotBody palette={palette} />
      <ChestMark palette={palette} style={style} />
      <path
        d="M36 14 L36 20 M33 17 L36 14 L39 17"
        stroke={palette.red}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </TabSvg>
  );
}

const ACTION_MAP: Record<MascotTabAction, ComponentType<IconProps>> = {
  home: MascotHomeIcon,
  schedule: MascotScheduleIcon,
  events: MascotEventsIcon,
  calendar: MascotCalendarIcon,
  team: MascotTeamIcon,
  notify: MascotNotifyIcon,
  feedback: MascotFeedbackIcon,
};

/** 依動作類型渲染 Tab mascot icon（註解：自動讀取 Logo 風格）。 */
export function MascotTabIcon({
  action,
  size = 24,
  active = false,
  className,
}: Omit<IconProps, "palette" | "style"> & { action: MascotTabAction }) {
  const { style } = useBrandStyle();
  const palette = paletteFor(style);
  const Icon = ACTION_MAP[action];
  return <Icon size={size} active={active} className={className} palette={palette} style={style} />;
}

/** 依 Tab 中文標籤對應 mascot 動作 */
export function mascotActionForTabLabel(label: string): MascotTabAction {
  switch (label) {
    case "總覽":
      return "home";
    case "行程":
      return "schedule";
    case "事件":
      return "events";
    case "行事曆":
      return "calendar";
    case "隊伍":
      return "team";
    case "通知":
      return "notify";
    case "回饋":
      return "feedback";
    default:
      return "home";
  }
}
