import {
  COURT_VIEWBOX,
  CourtFullSurface,
  courtNormToSvg,
  isOpponentHalfByLengthNorm,
} from "@/components/court-formation/court-full-surface";
import type { CourtSketchData } from "@/lib/court-sketch-schema";

const R_PLAYER = 8;
const R_BALL = 7;

/** 球員端：唯讀全場企位（註解：與教練端 v2 座標一致）。 */
export function CourtFormationReadonly({ data }: { data: CourtSketchData | null }) {
  if (!data) {
    return <p className="text-sm text-slate-600">教練尚未設定企位圖。</p>;
  }

  const hasTokens = data.tokens.length > 0;
  const hasLines = data.lines.length > 0;
  const notesTrim = data.notes?.trim();
  const hasNotes = Boolean(notesTrim);

  if (!hasTokens && !hasLines && !hasNotes) {
    return <p className="text-sm text-slate-600">教練尚未設定企位圖。</p>;
  }

  return (
    <div className="space-y-3">
      {hasTokens || hasLines ?
        <div className="relative mx-auto max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner md:max-w-lg">
          <svg viewBox={COURT_VIEWBOX} className="block h-auto w-full" role="img" aria-label="排球全場企位圖">
            <CourtFullSurface variant="player" />

            <g style={{ pointerEvents: "none" }}>
              {data.lines.map((ln) => {
                const a = courtNormToSvg(ln.x1, ln.y1);
                const b = courtNormToSvg(ln.x2, ln.y2);
                return (
                  <line
                    key={ln.id}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="#e11d48"
                    strokeWidth={1.4}
                    strokeLinecap="round"
                  />
                );
              })}
            </g>

            {data.tokens.map((t) => {
              const { x: cx, y: cy } = courtNormToSvg(t.x, t.y);
              if (t.kind === "BALL") {
                return (
                  <g key={t.id}>
                    <circle cx={cx} cy={cy} r={R_BALL} fill="#ea580c" stroke="#fff7ed" strokeWidth={1} />
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={6}
                      fill="white"
                      className="pointer-events-none select-none font-semibold"
                    >
                      {t.label?.trim() || "球"}
                    </text>
                  </g>
                );
              }
              const opp = isOpponentHalfByLengthNorm(t.y);
              return (
                <g key={t.id}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={R_PLAYER}
                    fill={opp ? "#dc2626" : "#334155"}
                    stroke={opp ? "#fecaca" : "#e2e8f0"}
                    strokeWidth={1}
                  />
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={7}
                    fill="white"
                    className="pointer-events-none select-none font-semibold"
                  >
                    {t.label || "·"}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      : null}
      {hasNotes ?
        <p className="whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800">
          {notesTrim}
        </p>
      : null}
    </div>
  );
}
