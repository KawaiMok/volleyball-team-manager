/**
 * 相容舊 import（註解：請改用 `getSportModule(id).court` 或排球 `volleyball/court/config`）。
 */
export {
  VOLLEYBALL_COURT_VIEWBOX as COURT_VIEWBOX,
  volleyballCourtNormToSvg as courtNormToSvg,
  volleyballIsOpponentHalf as isOpponentHalfByLengthNorm,
} from "@/lib/sports/volleyball/court/config";
export { VolleyballCourtSurface as CourtFullSurface } from "@/lib/sports/volleyball/court/surface";
