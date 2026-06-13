/** 半場長 9m 對應 svg 100 單位；三米線距網 3m → (3/9)×100（註解：貼網側）。 */
const HALF_LEN_UNITS = 100;
const ATTACK_OFFSET_FROM_NET = (3 / 9) * HALF_LEN_UNITS;

/** 排球全場 SVG：左為對方端線、右為我方端線；網在中央（垂直線）。 */
export function VolleyballCourtSurface({ variant = "coach" }: { variant?: "coach" | "player" }) {
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

      <line x1={atkLeftX} y1={0} x2={atkLeftX} y2={100} stroke={stroke} strokeWidth={0.6} strokeDasharray="4 3" />
      <line x1={netX} y1={0} x2={netX} y2={100} stroke={netStroke} strokeWidth={2.5} />
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
