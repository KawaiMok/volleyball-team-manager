import { createScreenToNorm } from "@/lib/sports/court/coords";
import type { SportCourtModule } from "@/lib/sports/court/types";

import { basketballLiveTacticalStarterTokens } from "./default-sketch";
import { BasketballCourtSurface } from "./surface";

/** 橫向全場 viewBox：長 282×寬 150（NBA 94×50 ft） */
export const BASKETBALL_COURT_VIEWBOX = "0 0 282 150";
const NORM_WIDTH = 150;
const NORM_LENGTH = 282;

export function basketballCourtNormToSvg(xWidth: number, yLength: number) {
  return { x: yLength * NORM_LENGTH, y: xWidth * NORM_WIDTH };
}

/** 場長 y：0＝對方籃下、1＝我方籃下；中線在 0.5 */
export function basketballIsOpponentHalf(yLength: number): boolean {
  return yLength < 0.5;
}

/** 籃球戰術板外掛（NBA 5v5 全場） */
export const basketballCourtModule: SportCourtModule = {
  viewBox: BASKETBALL_COURT_VIEWBOX,
  displayAspectRatio: 282 / 150,
  courtNormToSvg: basketballCourtNormToSvg,
  screenToNorm: createScreenToNorm(NORM_WIDTH, NORM_LENGTH),
  isOpponentHalf: basketballIsOpponentHalf,
  maxTokens: 16,
  maxLines: 40,
  labels: {
    ballDefault: "球",
    ballTool: "點擊放籃球",
    ballToolCompact: "球",
    ballLabelAria: "籃球標籤",
    boardAriaEvent: "籃球全場戰術圖",
    boardAriaLiveTactical: "即時戰術籃球場圖",
    clearConfirm: "確定刪除場上所有球員／籃球標記與畫線？（備註文字會保留）",
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
    readonlyAria: "籃球全場戰術圖",
    readonlyEmpty: "教練尚未設定戰術圖。",
  },
  Surface: BasketballCourtSurface,
  withLiveTacticalStarterTokens: basketballLiveTacticalStarterTokens,
};
