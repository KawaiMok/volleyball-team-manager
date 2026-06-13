import { NextResponse } from "next/server";

import type { SportCapabilities } from "@/lib/sports/types";

/** API 回傳：此運動尚未開放該功能 */
export function sportFeatureUnavailableResponse(feature: keyof SportCapabilities) {
  const labels: Record<keyof SportCapabilities, string> = {
    courtSketch: "內建場上企位",
    liveTactical: "即時戰術版",
    matchStats: "比賽統計",
  };
  return NextResponse.json(
    { error: `此運動尚未開放「${labels[feature]}」（即將推出）` },
    { status: 403 },
  );
}
