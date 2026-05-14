/** 橫向全場：長 200×寬 100（18m×9m）（註解：網為垂直線於 x=100；儲存 x=寬度 y=長度）。 */
export const COURT_VIEWBOX = "0 0 200 100";

/** 正規化座標 → SVG：長度沿水平 x、寬度沿垂直 y（註解：token／線端點共用）。 */
export function courtNormToSvg(xWidth: number, yLength: number) {
  return { x: yLength * 200, y: xWidth * 100 };
}

/** 場長正規化 y：0＝對方端線、1＝我方端線；網在 0.5（註解：<0.5 為對方半場）。 */
export function isOpponentHalfByLengthNorm(yLength: number): boolean {
  return yLength < 0.5;
}

/** 半場長 9m 對應 svg 100 單位；三米線距網 3m → (3/9)×100（註解：貼網側，非貼端線）。 */
const HALF_LEN_UNITS = 100;
const ATTACK_OFFSET_FROM_NET = (3 / 9) * HALF_LEN_UNITS;

/** 排球全場 SVG：左為對方端線、右為我方端線；網在中央（垂直線）。 */
export function CourtFullSurface({ variant = "coach" }: { variant?: "coach" | "player" }) {
  const stroke = variant === "player" ? "#64748b" : "#71717a";
  const fill = variant === "player" ? "#f8fafc" : "#fafafa";
  const netStroke = variant === "player" ? "#0f172a" : "#18181b";
  const atk = variant === "player" ? "#94a3b8" : "#a1a1aa";

  const netX = 100;
  const atkLeftX = netX - ATTACK_OFFSET_FROM_NET;
  const atkRightX = netX + ATTACK_OFFSET_FROM_NET;

  return (
    <>
      <rect x={0} y={0} width={200} height={100} fill={fill} stroke={stroke} strokeWidth={0.8} />

      {/* 對方三米線（近網） */}
      <line x1={atkLeftX} y1={0} x2={atkLeftX} y2={100} stroke={stroke} strokeWidth={0.6} strokeDasharray="4 3" />
      {/* 網 */}
      <line x1={netX} y1={0} x2={netX} y2={100} stroke={netStroke} strokeWidth={2.5} />
      {/* 我方三米線（近網） */}
      <line x1={atkRightX} y1={0} x2={atkRightX} y2={100} stroke={stroke} strokeWidth={0.6} strokeDasharray="4 3" />

      <text
        x={50}
        y={12}
        textAnchor="middle"
        fontSize={7}
        fill={variant === "player" ? "#475569" : "#52525b"}
        className="select-none font-semibold"
      >
        對方
      </text>
      <text
        x={150}
        y={12}
        textAnchor="middle"
        fontSize={7}
        fill={variant === "player" ? "#475569" : "#52525b"}
        className="select-none font-semibold"
      >
        我方
      </text>
      <text x={netX - 8} y={52} fontSize={6} fill={atk} className="select-none" textAnchor="middle">
        網
      </text>
      <text x={atkLeftX} y={8} fontSize={4} fill={atk} className="select-none" textAnchor="middle">
        攻擊線
      </text>
      <text x={atkRightX} y={8} fontSize={4} fill={atk} className="select-none" textAnchor="middle">
        攻擊線
      </text>
    </>
  );
}
