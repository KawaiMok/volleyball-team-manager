/** 底 Tab 用 mascot 動作圖（註解：依 org logo 排球小角色，48×48 viewBox） */
import type { ComponentType, ReactNode } from "react";

export type MascotTabAction =
  | "home"
  | "schedule"
  | "events"
  | "calendar"
  | "team"
  | "notify"
  | "feedback";

const BLUE = "#1565c4";
const RED = "#a6192e";

/** 排球身體 + 笑臉（註解：Tab 尺寸共用基底） */
function MascotBody({ cx = 24, cy = 26, r = 17 }: { cx?: number; cy?: number; r?: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={BLUE} />
      <path
        d={`M${cx} ${cy - r + 4} C${cx - 8} ${cy - 6} ${cx - r + 2} ${cy + 2} ${cx - r + 2} ${cy + 4}`}
        stroke="#fff"
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d={`M${cx} ${cy - r + 4} C${cx + 8} ${cy - 6} ${cx + r - 2} ${cy + 2} ${cx + r - 2} ${cy + 4}`}
        stroke="#fff"
        strokeWidth="1.8"
        fill="none"
      />
      <path d={`M${cx - r + 3} ${cy + 2} H${cx + r - 3}`} stroke="#fff" strokeWidth="1.8" fill="none" />
      <circle cx={cx - 5} cy={cy - 2} r="1.8" fill="#fff" />
      <circle cx={cx + 5} cy={cy - 2} r="1.8" fill="#fff" />
      <path
        d={`M${cx - 5} ${cy + 5} Q${cx} ${cy + 9} ${cx + 5} ${cy + 5}`}
        stroke="#fff"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </>
  );
}

/** 胸前小圖騰 */
function MiniEmblem({ cx = 24, cy = 30 }: { cx?: number; cy?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(0.45)`}>
      <path d="M0 -8 L4 -2 L0 1 L-4 -2 Z" fill="#fff" stroke={RED} strokeWidth="1.2" />
      <path d="M0 1 L0 7" stroke={RED} strokeWidth="1.2" />
    </g>
  );
}

type IconProps = {
  size?: number;
  active?: boolean;
  className?: string;
};

function TabSvg({
  size = 24,
  active = false,
  className = "",
  children,
}: IconProps & { children: ReactNode }) {
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

/** 總覽：揮手打招呼 */
export function MascotHomeIcon({ size = 24, active, className }: IconProps) {
  return (
    <TabSvg size={size} active={active} className={className}>
      <ellipse cx="14" cy="28" rx="3.5" ry="5" fill={BLUE} transform="rotate(-35 14 28)" />
      <ellipse cx="36" cy="20" rx="3" ry="4.5" fill={BLUE} transform="rotate(25 36 20)" />
      <MascotBody />
      <MiniEmblem />
    </TabSvg>
  );
}

/** 行程：拿小旗標 */
export function MascotScheduleIcon({ size = 24, active, className }: IconProps) {
  return (
    <TabSvg size={size} active={active} className={className}>
      <MascotBody />
      <MiniEmblem />
      <path d="M34 14 V32" stroke={BLUE} strokeWidth="2" strokeLinecap="round" />
      <path d="M34 14 L40 16 L34 18 Z" fill={RED} />
    </TabSvg>
  );
}

/** 事件：拿記事板 */
export function MascotEventsIcon({ size = 24, active, className }: IconProps) {
  return (
    <TabSvg size={size} active={active} className={className}>
      <MascotBody cy={27} />
      <rect x="30" y="10" width="14" height="18" rx="2" fill="#fff" stroke={BLUE} strokeWidth="1.5" />
      <path d="M33 16 H41 M33 20 H41 M33 24 H38" stroke={BLUE} strokeWidth="1.2" strokeLinecap="round" />
    </TabSvg>
  );
}

/** 行事曆：頭頂小月曆 */
export function MascotCalendarIcon({ size = 24, active, className }: IconProps) {
  return (
    <TabSvg size={size} active={active} className={className}>
      <rect x="14" y="6" width="20" height="16" rx="2" fill="#fff" stroke={BLUE} strokeWidth="1.5" />
      <path d="M14 11 H34" stroke={BLUE} strokeWidth="1.2" />
      <circle cx="20" cy="16" r="1.5" fill={RED} />
      <circle cx="24" cy="16" r="1.5" fill={BLUE} />
      <circle cx="28" cy="16" r="1.5" fill={BLUE} />
      <MascotBody cy={30} r={15} />
      <circle cx="19" cy="28" r="1.4" fill="#fff" />
      <circle cx="29" cy="28" r="1.4" fill="#fff" />
    </TabSvg>
  );
}

/** 隊伍：三人組隊 */
export function MascotTeamIcon({ size = 24, active, className }: IconProps) {
  return (
    <TabSvg size={size} active={active} className={className}>
      <circle cx="14" cy="30" r="9" fill={BLUE} opacity="0.85" />
      <circle cx="34" cy="30" r="9" fill={BLUE} opacity="0.85" />
      <MascotBody cy={24} r={14} />
      <MiniEmblem cy={28} />
    </TabSvg>
  );
}

/** 通知：搖鈴 */
export function MascotNotifyIcon({ size = 24, active, className }: IconProps) {
  return (
    <TabSvg size={size} active={active} className={className}>
      <ellipse cx="36" cy="14" rx="3" ry="4.5" fill={BLUE} transform="rotate(20 36 14)" />
      <MascotBody />
      <MiniEmblem />
      <path
        d="M32 8 C32 5 36 4 38 7 L38 14 C38 16 36 17 34 17"
        stroke={RED}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="34" cy="18" r="1.2" fill={RED} />
    </TabSvg>
  );
}

/** 回饋：比讚 */
export function MascotFeedbackIcon({ size = 24, active, className }: IconProps) {
  return (
    <TabSvg size={size} active={active} className={className}>
      <ellipse cx="36" cy="22" rx="4" ry="5.5" fill={BLUE} transform="rotate(15 36 22)" />
      <MascotBody />
      <MiniEmblem />
      <path
        d="M36 14 L36 20 M33 17 L36 14 L39 17"
        stroke={RED}
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

/** 依動作類型渲染 Tab mascot icon */
export function MascotTabIcon({
  action,
  size = 24,
  active = false,
  className,
}: IconProps & { action: MascotTabAction }) {
  const Icon = ACTION_MAP[action];
  return <Icon size={size} active={active} className={className} />;
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
