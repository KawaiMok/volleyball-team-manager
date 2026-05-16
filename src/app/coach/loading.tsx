import { AppRouteLoading } from "@/components/app-route-loading";

/** 教練區外層轉場（註解：`(main)` 外如 forbidden、onboarding、login）。 */
export default function CoachSegmentLoading() {
  return <AppRouteLoading variant="coach" />;
}
