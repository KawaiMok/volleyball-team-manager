/** NBA 全場 94×50 ft；viewBox 長 282、寬 150（註解：1 ft＝3 SVG 單位；長度沿水平 x）。 */
const COURT_LENGTH_FT = 94;
const COURT_WIDTH_FT = 50;
const LENGTH = COURT_LENGTH_FT * 3;
const WIDTH = COURT_WIDTH_FT * 3;
const HALF_X = LENGTH / 2;

/** NBA 尺寸（英尺） */
const BACKBOARD_FROM_BASELINE_FT = 4;
const BASKET_FROM_BASELINE_FT = 5.5;
const BACKBOARD_WIDTH_FT = 6;
const KEY_DEPTH_FT = 19;
const KEY_WIDTH_FT = 16;
const FT_CIRCLE_R_FT = 6;
const THREE_PT_R_FT = 23 + 9 / 12; /** 23'9" */
const THREE_PT_SIDE_INSET_FT = 3;
const CENTER_CIRCLE_R_FT = 6;
const RESTRICTED_R_FT = 4;
/** 禁區邊線 hash mark 長度 */
const HASH_MARK_LEN_FT = 0.5;

function lenFt(ft: number) {
  return (ft / COURT_LENGTH_FT) * LENGTH;
}

function widFt(ft: number) {
  return (ft / COURT_WIDTH_FT) * WIDTH;
}

type EndProps = {
  endX: number;
  inward: 1 | -1;
  stroke: string;
  thinStroke: number;
  lineStroke: number;
};

/** 禁區矩形 + 完整罰球圈 + 兩側 hash marks（註解：對齊戰術板示意圖） */
function KeyArea({ endX, inward, stroke, thinStroke, lineStroke }: EndProps) {
  const depth = lenFt(KEY_DEPTH_FT);
  const keyW = widFt(KEY_WIDTH_FT);
  const y0 = (WIDTH - keyW) / 2;
  const y1 = y0 + keyW;
  const x0 = inward > 0 ? endX : endX - depth;
  const ftCx = inward > 0 ? endX + depth : endX - depth;
  const ftR = lenFt(FT_CIRCLE_R_FT);
  const hashLen = lenFt(HASH_MARK_LEN_FT);

  /** NBA 禁區邊線標記位置（距底線） */
  const hashOffsetsFt = [7, 11, 15, 19];

  return (
    <>
      <rect x={x0} y={y0} width={depth} height={keyW} fill="none" stroke={stroke} strokeWidth={lineStroke} />
      <circle cx={ftCx} cy={WIDTH / 2} r={ftR} fill="none" stroke={stroke} strokeWidth={lineStroke} />
      {hashOffsetsFt.map((ft) => {
        const mx = inward > 0 ? endX + lenFt(ft) : endX - lenFt(ft);
        if (ft >= KEY_DEPTH_FT) return null;
        return (
          <g key={ft}>
            <line
              x1={mx}
              y1={y0}
              x2={mx + inward * hashLen}
              y2={y0}
              stroke={stroke}
              strokeWidth={thinStroke}
            />
            <line
              x1={mx}
              y1={y1}
              x2={mx + inward * hashLen}
              y2={y1}
              stroke={stroke}
              strokeWidth={thinStroke}
            />
          </g>
        );
      })}
    </>
  );
}

/** 籃板、籃筐、合理碰撞區半圓（註解：實線半圓） */
function BasketAssembly({ endX, inward, stroke, thinStroke, lineStroke }: EndProps) {
  const boardX = inward > 0 ? endX + lenFt(BACKBOARD_FROM_BASELINE_FT) : endX - lenFt(BACKBOARD_FROM_BASELINE_FT);
  const bcx = inward > 0 ? endX + lenFt(BASKET_FROM_BASELINE_FT) : endX - lenFt(BASKET_FROM_BASELINE_FT);
  const bcy = WIDTH / 2;
  const boardHalf = widFt(BACKBOARD_WIDTH_FT) / 2;
  const rRest = lenFt(RESTRICTED_R_FT);
  const sweep = inward > 0 ? 1 : 0;

  return (
    <>
      {/* 籃板（平行底線的短線段） */}
      <line
        x1={boardX}
        y1={bcy - boardHalf}
        x2={boardX}
        y2={bcy + boardHalf}
        stroke={stroke}
        strokeWidth={lineStroke}
      />
      {/* 籃筐支架 */}
      <line x1={boardX} y1={bcy} x2={bcx} y2={bcy} stroke={stroke} strokeWidth={thinStroke} />
      <circle cx={bcx} cy={bcy} r={1.4} fill="none" stroke={stroke} strokeWidth={lineStroke} />
      {/* 合理碰撞區 */}
      <path
        d={`M ${bcx} ${bcy - rRest} A ${rRest} ${rRest} 0 0 ${sweep} ${bcx} ${bcy + rRest}`}
        fill="none"
        stroke={stroke}
        strokeWidth={lineStroke}
      />
    </>
  );
}

/** NBA 三分線：底角直線（距邊線 3 ft）+ 23'9" 弧（註解：弧朝場內，非朝底線） */
function ThreePointLine({ endX, inward, stroke, lineStroke }: EndProps) {
  const bcx = inward > 0 ? endX + lenFt(BASKET_FROM_BASELINE_FT) : endX - lenFt(BASKET_FROM_BASELINE_FT);
  const bcy = WIDTH / 2;
  /** 半徑用 ft→SVG（長寬皆 1 ft＝3 單位，圓不會被拉扁） */
  const r = lenFt(THREE_PT_R_FT);
  const yTop = widFt(THREE_PT_SIDE_INSET_FT);
  const yBot = WIDTH - widFt(THREE_PT_SIDE_INSET_FT);

  /** 弧與底角直線（y＝3 ft inset）的交點 x */
  const dxTop = Math.sqrt(Math.max(0, r * r - (yTop - bcy) ** 2));
  const dxBot = Math.sqrt(Math.max(0, r * r - (yBot - bcy) ** 2));
  const xTop = inward > 0 ? bcx + dxTop : bcx - dxTop;
  const xBot = inward > 0 ? bcx + dxBot : bcx - dxBot;
  /**
   * large-arc＝0：取「小弧」朝場內外凸；sweep 左半場順時針、右半場逆時針。
   * 先前 large-arc＝1 會畫成朝底線的大弧（視覺上三分線錯位）。
   */
  const sweep = inward > 0 ? 1 : 0;

  return (
    <path
      d={`M ${endX} ${yTop} L ${xTop} ${yTop} A ${r} ${r} 0 0 ${sweep} ${xBot} ${yBot} L ${endX} ${yBot}`}
      fill="none"
      stroke={stroke}
      strokeWidth={lineStroke}
    />
  );
}

/** NBA 全場（戰術板示意風格：白底黑線）；左對方、右我方。 */
export function BasketballCourtSurface({ variant = "coach" }: { variant?: "coach" | "player" }) {
  const isPlayer = variant === "player";
  const fill = isPlayer ? "#f8fafc" : "#ffffff";
  const stroke = isPlayer ? "#334155" : "#171717";
  const boundaryW = 1.15;
  const lineW = 0.75;
  const thinW = 0.55;
  const centerR = lenFt(CENTER_CIRCLE_R_FT);

  const lineProps = { stroke, thinStroke: thinW, lineStroke: lineW };
  const leftEnd = { endX: 0, inward: 1 as const, ...lineProps };
  const rightEnd = { endX: LENGTH, inward: -1 as const, ...lineProps };

  return (
    <>
      <rect x={0} y={0} width={LENGTH} height={WIDTH} fill={fill} />

      <rect x={0} y={0} width={LENGTH} height={WIDTH} fill="none" stroke={stroke} strokeWidth={boundaryW} />

      <line x1={HALF_X} y1={0} x2={HALF_X} y2={WIDTH} stroke={stroke} strokeWidth={lineW} />
      <circle cx={HALF_X} cy={WIDTH / 2} r={centerR} fill="none" stroke={stroke} strokeWidth={lineW} />

      <KeyArea {...leftEnd} />
      <KeyArea {...rightEnd} />
      <BasketAssembly {...leftEnd} />
      <BasketAssembly {...rightEnd} />
      {/* 三分線畫在禁區／籃筐之上，避免交疊處被遮住 */}
      <ThreePointLine {...leftEnd} />
      <ThreePointLine {...rightEnd} />

      <text
        x={HALF_X * 0.5}
        y={9}
        textAnchor="middle"
        fontSize={6}
        fill={isPlayer ? "#64748b" : "#52525b"}
        className="select-none font-semibold"
      >
        對方
      </text>
      <text
        x={HALF_X * 1.5}
        y={9}
        textAnchor="middle"
        fontSize={6}
        fill={isPlayer ? "#64748b" : "#52525b"}
        className="select-none font-semibold"
      >
        我方
      </text>
    </>
  );
}
