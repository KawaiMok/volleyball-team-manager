import type { DailyRpePoint } from "@/lib/coach-dashboard-rpe-series";

type Props = { points: DailyRpePoint[] };

/** 近 N 日 RPE 趨勢（SVG，無額外套件）（註解：1–10 刻度；無資料日不畫線）。 */
export function CoachDashboardRpeChart({ points }: Props) {
  if (points.length === 0) return null;

  const padL = 40;
  const padR = 12;
  const padT = 16;
  const padB = 36;
  const w = 640;
  const h = 200;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const rpeMin = 1;
  const rpeMax = 10;
  const n = points.length;

  const xAt = (i: number) => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (rpe: number) => padT + plotH - ((rpe - rpeMin) / (rpeMax - rpeMin)) * plotH;

  const segments: string[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = points[i].avgRpe;
    const b = points[i + 1].avgRpe;
    if (a != null && b != null) {
      segments.push(`M ${xAt(i)} ${yAt(a)} L ${xAt(i + 1)} ${yAt(b)}`);
    }
  }

  const ticks = [10, 7, 4, 1];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-800">近 {n} 天 · 每日平均 RPE</h3>
      <p className="mt-1 text-xs text-zinc-500">僅含本隊訓練／事件底下已提交之身體回饋；無回饋日不連線。</p>
      <div className="mt-4 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="h-auto min-w-[min(100%,640px)] w-full max-w-full"
          role="img"
          aria-label="近 30 天每日平均 RPE 折線圖"
        >
          <rect x={0} y={0} width={w} height={h} fill="white" />
          {ticks.map((tv) => (
            <g key={tv}>
              <line
                x1={padL}
                y1={yAt(tv)}
                x2={w - padR}
                y2={yAt(tv)}
                stroke="#e4e4e7"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text x={padL - 8} y={yAt(tv) + 4} textAnchor="end" fill="#71717a" fontSize={11}>
                {tv}
              </text>
            </g>
          ))}
          {segments.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" />
          ))}
          {points.map((p, i) =>
            p.avgRpe != null ?
              <circle key={p.ymd} cx={xAt(i)} cy={yAt(p.avgRpe)} r={4} fill="#4f46e5" stroke="white" strokeWidth={1} />
            : null,
          )}
          {points.map((p, i) =>
            i % Math.ceil(n / 8) === 0 || i === n - 1 ?
              <text
                key={`${p.ymd}-x`}
                x={xAt(i)}
                y={h - 10}
                textAnchor="middle"
                fill="#71717a"
                fontSize={10}
              >
                {p.label}
              </text>
            : null,
          )}
        </svg>
      </div>
    </div>
  );
}
