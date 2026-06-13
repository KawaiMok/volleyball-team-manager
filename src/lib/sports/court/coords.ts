/** 正規化座標限制在 0–1 */
export function clampCourtNorm(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * 螢幕座標 → 儲存座標（x=場寬、y=場長）（註解：依 viewBox 寬高比例建立）。
 * @param normWidth SVG viewBox 高度（對應儲存 x）
 * @param normLength SVG viewBox 寬度（對應儲存 y）
 */
export function createScreenToNorm(normWidth: number, normLength: number) {
  return function screenToNorm(
    clientX: number,
    clientY: number,
    svg: SVGSVGElement,
  ): { x: number; y: number } | null {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = pt.matrixTransform(ctm.inverse());
    return {
      x: clampCourtNorm(p.y / normWidth),
      y: clampCourtNorm(p.x / normLength),
    };
  };
}
