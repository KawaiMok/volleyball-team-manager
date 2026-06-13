/** 足球場比例 105×68m；viewBox 長 210、寬 136（註解：長度沿水平 x）。 */
const LENGTH = 210;
const WIDTH = 136;
const HALF_X = LENGTH / 2;

/** 米 → 水平（場長）單位 */
function lenM(m: number) {
  return (m / 105) * LENGTH;
}

/** 米 → 垂直（場寬）單位 */
function widM(m: number) {
  return (m / 68) * WIDTH;
}

/** 禁區／小禁區繪製（註解：endX 為底線 x；inward 為向場內延伸方向 ±1） */
function PenaltyBox({
  endX,
  inward,
  stroke,
}: {
  endX: number;
  inward: 1 | -1;
  stroke: string;
}) {
  const depth = lenM(16.5);
  const boxW = widM(40.32);
  const y0 = (WIDTH - boxW) / 2;
  const x0 = inward > 0 ? endX : endX - depth;
  return (
    <rect
      x={x0}
      y={y0}
      width={depth}
      height={boxW}
      fill="none"
      stroke={stroke}
      strokeWidth={0.7}
    />
  );
}

function GoalArea({
  endX,
  inward,
  stroke,
}: {
  endX: number;
  inward: 1 | -1;
  stroke: string;
}) {
  const depth = lenM(5.5);
  const boxW = widM(18.32);
  const y0 = (WIDTH - boxW) / 2;
  const x0 = inward > 0 ? endX : endX - depth;
  return (
    <rect
      x={x0}
      y={y0}
      width={depth}
      height={boxW}
      fill="none"
      stroke={stroke}
      strokeWidth={0.6}
    />
  );
}

/** 足球全場 SVG：左為對方底線、右為我方底線；中線在中央。 */
export function SoccerCourtSurface({ variant = "coach" }: { variant?: "coach" | "player" }) {
  const stroke = variant === "player" ? "#64748b" : "#71717a";
  const lineStroke = variant === "player" ? "#475569" : "#52525b";
  const grassA = variant === "player" ? "#ecfdf5" : "#f0fdf4";
  const grassB = variant === "player" ? "#d1fae5" : "#dcfce7";
  const centerR = lenM(9.15);

  return (
    <>
      {/* 半場著色（註解：左對方、右我方） */}
      <rect x={0} y={0} width={HALF_X} height={WIDTH} fill={grassA} />
      <rect x={HALF_X} y={0} width={HALF_X} height={WIDTH} fill={grassB} />

      <rect x={0} y={0} width={LENGTH} height={WIDTH} fill="none" stroke={stroke} strokeWidth={0.9} />

      <line x1={HALF_X} y1={0} x2={HALF_X} y2={WIDTH} stroke={lineStroke} strokeWidth={1} />

      <circle cx={HALF_X} cy={WIDTH / 2} r={centerR} fill="none" stroke={lineStroke} strokeWidth={0.7} />
      <circle cx={HALF_X} cy={WIDTH / 2} r={1.2} fill={lineStroke} />

      <PenaltyBox endX={0} inward={1} stroke={lineStroke} />
      <PenaltyBox endX={LENGTH} inward={-1} stroke={lineStroke} />
      <GoalArea endX={0} inward={1} stroke={lineStroke} />
      <GoalArea endX={LENGTH} inward={-1} stroke={lineStroke} />

      {/* 點球點 */}
      <circle cx={lenM(11)} cy={WIDTH / 2} r={1} fill={lineStroke} />
      <circle cx={LENGTH - lenM(11)} cy={WIDTH / 2} r={1} fill={lineStroke} />

      <text
        x={HALF_X * 0.5}
        y={10}
        textAnchor="middle"
        fontSize={7}
        fill={variant === "player" ? "#475569" : "#52525b"}
        className="select-none font-semibold"
      >
        對方
      </text>
      <text
        x={HALF_X * 1.5}
        y={10}
        textAnchor="middle"
        fontSize={7}
        fill={variant === "player" ? "#475569" : "#52525b"}
        className="select-none font-semibold"
      >
        我方
      </text>
    </>
  );
}
