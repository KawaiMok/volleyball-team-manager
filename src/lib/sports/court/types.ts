import type { ComponentType } from "react";

import type { CourtSketchData } from "@/lib/court-sketch-schema";

/** 戰術板／企位 UI 文案（註解：依運動替換「排球」等字樣）。 */
export type SportCourtLabels = {
  ballDefault: string;
  ballTool: string;
  ballToolCompact: string;
  ballLabelAria: string;
  boardAriaEvent: string;
  boardAriaLiveTactical: string;
  clearConfirm: string;
  playerTool: string;
  playerToolCompact: string;
  selectTool: string;
  selectToolCompact: string;
  lineTool: string;
  lineToolCompact: string;
  fullscreenTitleEvent: string;
  fullscreenTitleLiveTactical: string;
  saveToastEvent: string;
  saveToastLiveTactical: string;
  saveButtonEvent: string;
  saveButtonLiveTactical: string;
  readonlyAria: string;
  readonlyEmpty: string;
};

/** 單一運動的場地繪製與座標設定（註解：Phase 1 排球實作；足球／籃球 Phase 3）。 */
export type SportCourtModule = {
  viewBox: string;
  /** 全屏／預覽容器寬高比（viewBox 寬 ÷ 高；註解：須與 viewBox 一致以免裁切）。 */
  displayAspectRatio: number;
  courtNormToSvg: (xWidth: number, yLength: number) => { x: number; y: number };
  screenToNorm: (clientX: number, clientY: number, svg: SVGSVGElement) => { x: number; y: number } | null;
  isOpponentHalf: (yLength: number) => boolean;
  maxTokens: number;
  maxLines: number;
  labels: SportCourtLabels;
  Surface: ComponentType<{ variant?: "coach" | "player" }>;
  /** 即時戰術版空白時注入預設站位 */
  withLiveTacticalStarterTokens: (sketch: CourtSketchData | null) => CourtSketchData;
};
