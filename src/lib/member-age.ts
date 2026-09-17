/** 依出生日期計算滿歲（註解：無 birthDate 回 null）。 */
export function computeAgeYears(birthDate: Date | string | null | undefined): number | null {
  if (!birthDate) return null;
  const bd = typeof birthDate === "string" ? new Date(`${birthDate.slice(0, 10)}T12:00:00`) : birthDate;
  if (Number.isNaN(bd.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - bd.getFullYear();
  const monthDiff = now.getMonth() - bd.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < bd.getDate())) {
    age -= 1;
  }
  return age >= 0 && age <= 120 ? age : null;
}
