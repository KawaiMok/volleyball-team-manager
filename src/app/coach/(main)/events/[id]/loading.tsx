import { AppRouteLoading } from "@/components/app-route-loading";

/** 教練端：由事件列表進入單一事件詳情時的載入畫面（註解：與 `(main)/loading` 色調一致）。 */
export default function CoachEventDetailLoading() {
  return <AppRouteLoading variant="coach" />;
}
