/** 球員「我的行程」視圖（註解：列表為預設；週／月與教練行事曆同錨點日）。 */
export type PlayerScheduleView = "list" | "week" | "month";

export function parsePlayerScheduleView(v: string | undefined): PlayerScheduleView {
  if (v === "week" || v === "month") return v;
  return "list";
}
