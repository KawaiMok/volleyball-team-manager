"use client";
import { useToast } from "@/components/toast-provider";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  COURT_VIEWBOX,
  CourtFullSurface,
  courtNormToSvg,
  isOpponentHalfByLengthNorm,
} from "@/components/court-formation/court-full-surface";
import type { CourtSketchData, CourtSketchToken } from "@/lib/court-sketch-schema";
import { COURT_SKETCH_VERSION, emptyCourtSketch } from "@/lib/court-sketch-schema";

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

/** 螢幕 → 儲存座標：x=場寬、y=場長（註解：橫向 viewBox 200×100，水平為長度）。 */
function screenToNorm(clientX: number, clientY: number, svg: SVGSVGElement): { x: number; y: number } | null {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const p = pt.matrixTransform(ctm.inverse());
  return { x: clamp01(p.y / 100), y: clamp01(p.x / 200) };
}

type EditorTool = "select" | "player" | "ball" | "line";

/** 事件企位 vs 總覽即時戰術版（註解：後者存 Team.liveTacticalSketch）。 */
export type CourtFormationEditorProps =
  | {
      variant: "event";
      eventId: string;
      initial: CourtSketchData | null;
      disabled: boolean;
    }
  | {
      variant: "liveTactical";
      initial: CourtSketchData | null;
      disabled: boolean;
    };

const R_PLAYER = 8;
const R_BALL = 7;
const dragThresholdPx = 10;
const maxTokens = 24;
const maxLines = 40;

/** 教練端：全場企位或即時戰術版（註解：企位 PATCH 事件 API；戰術版 PATCH `/api/team/live-tactical-sketch`）。 */
export function CourtFormationEditor(props: CourtFormationEditorProps) {
  const { initial, disabled } = props;
  const formId = props.variant === "event" ? props.eventId : "live-tactical";
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<CourtSketchData>(initial ?? emptyCourtSketch());
  const [tool, setTool] = useState<EditorTool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);

  const [lineDraft, setLineDraft] = useState<{ x1: number; y1: number } | null>(null);
  const [previewEnd, setPreviewEnd] = useState<{ x: number; y: number } | null>(null);

  const moveToken = useCallback((id: string, x: number, y: number) => {
    setData((d) => ({
      ...d,
      tokens: d.tokens.map((t) => (t.id === id ? { ...t, x: clamp01(x), y: clamp01(y) } : t)),
    }));
  }, []);

  useEffect(() => {
    if (!lineDraft) {
      setPreviewEnd(null);
      return;
    }
    const onMove = (ev: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const n = screenToNorm(ev.clientX, ev.clientY, svg);
      if (n) setPreviewEnd(n);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [lineDraft]);

  const onTokenPointerDown = (e: React.PointerEvent, id: string) => {
    if (disabled || tool !== "select") return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    setLineDraft(null);

    const startX = e.clientX;
    const startY = e.clientY;
    let dragging = false;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!dragging) {
        if (dx * dx + dy * dy < dragThresholdPx * dragThresholdPx) return;
        dragging = true;
        setDragId(id);
      }
      const svg = svgRef.current;
      if (!svg) return;
      const n = screenToNorm(ev.clientX, ev.clientY, svg);
      if (n) moveToken(id, n.x, n.y);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      setDragId(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  function handleSvgPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (disabled || dragId) return;
    const tag = (e.target as Element).tagName?.toLowerCase();
    if (tag === "circle" || tag === "text") return;

    const svg = svgRef.current;
    if (!svg) return;
    const n = screenToNorm(e.clientX, e.clientY, svg);
    if (!n) return;

    if (tool === "select") {
      setSelectedId(null);
      return;
    }

    if (tool === "player") {
      if (data.tokens.length >= maxTokens) return;
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID ?
          crypto.randomUUID()
        : `p-${Date.now()}`;
      const nPlayers = data.tokens.filter((t) => t.kind === "PLAYER").length;
      const newTok: CourtSketchToken = {
        id,
        kind: "PLAYER",
        label: `${nPlayers + 1}`,
        x: n.x,
        y: n.y,
      };
      setData((d) => ({ ...d, tokens: [...d.tokens, newTok] }));
      setSelectedId(id);
      return;
    }

    if (tool === "ball") {
      if (data.tokens.length >= maxTokens) return;
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID ?
          crypto.randomUUID()
        : `b-${Date.now()}`;
      const newTok: CourtSketchToken = {
        id,
        kind: "BALL",
        label: "球",
        x: n.x,
        y: n.y,
      };
      setData((d) => ({ ...d, tokens: [...d.tokens, newTok] }));
      setSelectedId(id);
      return;
    }

    if (tool === "line") {
      if (data.lines.length >= maxLines) return;
      if (!lineDraft) {
        setLineDraft({ x1: n.x, y1: n.y });
        return;
      }
      const lineId =
        typeof crypto !== "undefined" && crypto.randomUUID ?
          crypto.randomUUID()
        : `l-${Date.now()}`;
      setData((d) => ({
        ...d,
        lines: [
          ...d.lines,
          {
            id: lineId,
            x1: lineDraft.x1,
            y1: lineDraft.y1,
            x2: n.x,
            y2: n.y,
          },
        ],
      }));
      setLineDraft(null);
    }
  }

  function removeSelected() {
    if (disabled || !selectedId) return;
    setData((d) => ({ ...d, tokens: d.tokens.filter((t) => t.id !== selectedId) }));
    setSelectedId(null);
  }

  function clearAllMarkersAndLines() {
    if (disabled) return;
    if (!window.confirm("確定刪除場上所有球員／排球標記與畫線？（備註文字會保留）")) return;
    setData((d) => ({ ...d, tokens: [], lines: [] }));
    setSelectedId(null);
    setLineDraft(null);
  }

  const selectedToken = selectedId ? data.tokens.find((t) => t.id === selectedId) : undefined;

  async function save() {
    setPending(true);
    try {
      const payload: CourtSketchData = {
        version: COURT_SKETCH_VERSION,
        tokens: data.tokens,
        lines: data.lines,
        notes: data.notes?.trim() ? data.notes.trim().slice(0, 200) : undefined,
      };
      const url =
        props.variant === "liveTactical" ?
          "/api/team/live-tactical-sketch"
        : `/api/events/${props.eventId}/court-sketch`;
      const res = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      setPending(false);
      if (!res.ok) {
        showError((j as { error?: string }).error ?? `儲存失敗 (${res.status})`);
        return;
      }
      showSuccess(savedToastLabel);
      router.refresh();
    } catch {
      setPending(false);
      showError("網路錯誤");
    }
  }

  const isLiveTactical = props.variant === "liveTactical";
  const savedToastLabel = isLiveTactical ? "已儲存即時戰術版" : "已儲存企位圖";
  const saveButtonLabel = isLiveTactical ? "儲存戰術版" : "儲存企位圖";
  const boardAriaLabel = isLiveTactical ? "即時戰術排球場圖" : "排球全場企位圖";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2">
        <span className="self-center text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">工具</span>
        {(
          [
            ["select", "選取／拖曳"],
            ["player", "點擊放球員"],
            ["ball", "點擊放排球"],
            ["line", "畫線（點兩下）"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => {
              setTool(k);
              setLineDraft(null);
              if (k !== "select") setSelectedId(null);
            }}
            className={
              tool === k ?
                "rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white"
              : "rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:bg-zinc-800"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tool === "line" && lineDraft ?
        <p className="text-xs text-amber-800">已點第一點，請再點一下完成線段（按「選取」可取消第一點）。</p>
      : null}

      <div className="relative mx-auto max-w-md overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-inner touch-none md:max-w-lg">
        <svg
          ref={svgRef}
          viewBox={COURT_VIEWBOX}
          className="block h-auto w-full touch-none"
          onPointerDown={handleSvgPointerDown}
          role="img"
          aria-label={boardAriaLabel}
        >
          <CourtFullSurface variant="coach" />

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
            {lineDraft && previewEnd ?
              (() => {
                const p1 = courtNormToSvg(lineDraft.x1, lineDraft.y1);
                const p2 = courtNormToSvg(previewEnd.x, previewEnd.y);
                return (
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#f97316"
                    strokeWidth={1.2}
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                  />
                );
              })()
            : null}
          </g>

          {data.tokens.map((t) => {
            const { x: cx, y: cy } = courtNormToSvg(t.x, t.y);
            const sel = selectedId === t.id;
            if (t.kind === "BALL") {
              return (
                <g key={t.id} data-token="1">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={R_BALL}
                    fill={sel ? "#ea580c" : "#f97316"}
                    stroke="#fff7ed"
                    strokeWidth={1}
                    className={
                      disabled || tool !== "select" ?
                        disabled ?
                          "cursor-not-allowed opacity-60"
                        : "cursor-default"
                      : "cursor-grab active:cursor-grabbing"
                    }
                    onPointerDown={(e) => onTokenPointerDown(e, t.id)}
                  />
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
              <g key={t.id} data-token="1">
                <circle
                  cx={cx}
                  cy={cy}
                  r={R_PLAYER}
                  fill={
                    opp ?
                      sel ?
                        "#b91c1c"
                      : "#dc2626"
                    : sel ?
                      "#4f46e5"
                    : "#6366f1"
                  }
                  stroke={opp ? "#fecaca" : "#eef2ff"}
                  strokeWidth={1}
                  className={
                    disabled || tool !== "select" ?
                      disabled ?
                        "cursor-not-allowed opacity-60"
                      : "cursor-default"
                    : "cursor-grab active:cursor-grabbing"
                  }
                  onPointerDown={(e) => onTokenPointerDown(e, t.id)}
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

      {selectedToken ?
        <div>
          <label htmlFor={`court-token-label-${formId}`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {selectedToken.kind === "PLAYER" ?
              "選中球員標籤（最多 8 字）"
            : "排球標籤（最多 4 字，可簡寫）"}
          </label>
          <input
            ref={labelInputRef}
            id={`court-token-label-${formId}`}
            type="text"
            maxLength={selectedToken.kind === "PLAYER" ? 8 : 4}
            disabled={disabled}
            value={selectedToken.kind === "PLAYER" ? selectedToken.label : (selectedToken.label ?? "")}
            onChange={(e) => {
              const sid = selectedId;
              const maxL = selectedToken.kind === "PLAYER" ? 8 : 4;
              const v = e.target.value.slice(0, maxL);
              setData((d) => ({
                ...d,
                tokens: d.tokens.map((tok) => {
                  if (tok.id !== sid) return tok;
                  if (tok.kind === "PLAYER") return { ...tok, label: v };
                  return { ...tok, label: v || undefined };
                }),
              }));
            }}
            className="mt-1 w-full max-w-md rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:bg-zinc-100 dark:bg-zinc-800"
            placeholder={selectedToken.kind === "PLAYER" ? "例如：7、舉…" : "球"}
          />
        </div>
      : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || !selectedId || tool !== "select"}
          onClick={() => labelInputRef.current?.focus()}
          className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:bg-zinc-950 disabled:opacity-50"
        >
          編輯標籤
        </button>
        <button
          type="button"
          disabled={disabled || !selectedId || tool !== "select"}
          onClick={removeSelected}
          className="rounded-md border border-red-200 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
        >
          刪除選中標記
        </button>
        <button
          type="button"
          disabled={disabled || (data.tokens.length === 0 && data.lines.length === 0)}
          onClick={clearAllMarkersAndLines}
          className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-900 hover:bg-red-100 disabled:opacity-50"
        >
          清除全部標記與線
        </button>
        <button
          type="button"
          disabled={disabled || pending}
          onClick={() => void save()}
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? "儲存中…" : saveButtonLabel}
        </button>
      </div>

      <div>
        <label htmlFor={`court-notes-${formId}`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          備註（選填）
        </label>
        <textarea
          id={`court-notes-${formId}`}
          rows={2}
          maxLength={200}
          disabled={disabled}
          value={data.notes ?? ""}
          onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))}
          placeholder="例如：接發輪轉後站位…"
          className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:bg-zinc-100 dark:bg-zinc-800"
        />
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {isLiveTactical ?
          <>
            全場左側為對方、右側為我方；選取工具可拖曳標記。畫線請連點兩下場地。完成後請按「儲存戰術版」。此白板與各事件的「場上企位」分開儲存。
          </>
        : <>
            全場左側為對方、右側為我方；選取工具可拖曳標記。畫線請連點兩下場地。完成後請按「儲存企位圖」。球員可在該事件頁唯讀檢視。
          </>}
      </p>
    </div>
  );
}
