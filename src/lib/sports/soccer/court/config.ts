import { createScreenToNorm } from "@/lib/sports/court/coords";
import type { SportCourtModule } from "@/lib/sports/court/types";

import { soccerLiveTacticalStarterTokens } from "./default-sketch";
import { SoccerCourtSurface } from "./surface";

/** 橫向全場 viewBox：長 210×寬 136（105m×68m） */
export const SOCCER_COURT_VIEWBOX = "0 0 210 136";
const NORM_WIDTH = 136;
const NORM_LENGTH = 210;

export function soccerCourtNormToSvg(xWidth: number, yLength: number) {
  return { x: yLength * NORM_LENGTH, y: xWidth * NORM_WIDTH };
}

/** 場長 y：0＝對方底線、1＝我方底線；中線在 0.5 */
export function soccerIsOpponentHalf(yLength: number): boolean {
  return yLength < 0.5;
}

/** 足球戰術板外掛（11v11） */
export const soccerCourtModule: SportCourtModule = {
  viewBox: SOCCER_COURT_VIEWBOX,
  displayAspectRatio: 210 / 136,
  courtNormToSvg: soccerCourtNormToSvg,
  screenToNorm: createScreenToNorm(NORM_WIDTH, NORM_LENGTH),
  isOpponentHalf: soccerIsOpponentHalf,
  maxTokens: 26,
  maxLines: 40,
  labels: {
    ballDefault: "球",
    ballTool: "點擊放足球",
    ballToolCompact: "球",
    ballLabelAria: "足球標籤",
    boardAriaEvent: "足球全場戰術圖",
    boardAriaLiveTactical: "即時戰術足球場圖",
    clearConfirm: "確定刪除場上所有球員／足球標記與畫線？（備註文字會保留）",
    playerTool: "點擊放球員",
    playerToolCompact: "員",
    selectTool: "選取／拖曳",
    selectToolCompact: "選",
    lineTool: "畫線（點兩下）",
    lineToolCompact: "線",
    fullscreenTitleEvent: "場上企位",
    fullscreenTitleLiveTactical: "即時戰術版",
    saveToastEvent: "已儲存戰術圖",
    saveToastLiveTactical: "已儲存即時戰術版",
    saveButtonEvent: "儲存戰術圖",
    saveButtonLiveTactical: "儲存戰術版",
    readonlyAria: "足球全場戰術圖",
    readonlyEmpty: "教練尚未設定戰術圖。",
  },
  Surface: SoccerCourtSurface,
  withLiveTacticalStarterTokens: soccerLiveTacticalStarterTokens,
};
