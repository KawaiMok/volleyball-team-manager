import { AppRouteLoading } from "@/components/app-route-loading";

/** 球員區外層（註解：forbidden 等非 (main) 路由）。 */
export default function PlayerSegmentLoading() {
  return <AppRouteLoading variant="player" />;
}
