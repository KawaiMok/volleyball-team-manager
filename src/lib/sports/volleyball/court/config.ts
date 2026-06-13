import { createScreenToNorm } from "@/lib/sports/court/coords";
import type { SportCourtModule } from "@/lib/sports/court/types";

import { volleyballLiveTacticalStarterTokens } from "./default-sketch";
import { VolleyballCourtSurface } from "./surface";

/** 橫向全場 viewBox：長 200×寬 100（18m×9m）；儲存 x=寬、y=長 */
export const VOLLEYBALL_COURT_VIEWBOX = "0 0 200 100";
const NORM_WIDTH = 100;
const NORM_LENGTH = 200;

/** 正規化座標 → SVG：長度沿水平 x、寬度沿垂直 y */
export function volleyballCourtNormToSvg(xWidth: number, yLength: number) {
  return { x: yLength * NORM_LENGTH, y: xWidth * NORM_WIDTH };
}

/** 場長 y：0＝對方端線、1＝我方端線；網在 0.5 */
export function volleyballIsOpponentHalf(yLength: number): boolean {
  return yLength < 0.5;
}

/** 排球戰術板外掛設定 */
export const volleyballCourtModule: SportCourtModule = {
  viewBox: VOLLEYBALL_COURT_VIEWBOX,
  displayAspectRatio: 200 / 100,
  courtNormToSvg: volleyballCourtNormToSvg,
  screenToNorm: createScreenToNorm(NORM_WIDTH, NORM_LENGTH),
  isOpponentHalf: volleyballIsOpponentHalf,
  maxTokens: 24,
  maxLines: 40,
  labels: {
    ballDefault: "球",
    ballTool: "點擊放排球",
    ballToolCompact: "球",
    ballLabelAria: "排球標籤",
    boardAriaEvent: "排球全場企位圖",
    boardAriaLiveTactical: "即時戰術排球場圖",
    clearConfirm: "確定刪除場上所有球員／排球標記與畫線？（備註文字會保留）",
    playerTool: "點擊放球員",
    playerToolCompact: "員",
    selectTool: "選取／拖曳",
    selectToolCompact: "選",
    lineTool: "畫線（點兩下）",
    lineToolCompact: "線",
    fullscreenTitleEvent: "場上企位",
    fullscreenTitleLiveTactical: "即時戰術版",
    saveToastEvent: "已儲存企位圖",
    saveToastLiveTactical: "已儲存即時戰術版",
    saveButtonEvent: "儲存企位圖",
    saveButtonLiveTactical: "儲存戰術版",
    readonlyAria: "排球全場企位圖",
    readonlyEmpty: "教練尚未設定企位圖。",
  },
  Surface: VolleyballCourtSurface,
  withLiveTacticalStarterTokens: volleyballLiveTacticalStarterTokens,
};
