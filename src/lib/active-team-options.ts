/** 可切換的作用中隊伍（註解：同帳號可跨組織、跨隊）。 */
export type ActiveTeamOption = {
  id: string;
  name: string;
  organizationName: string;
};

/** 是否需在標籤顯示組織名（註解：多組織教練／球員才顯示，避免冗長）。 */
export function shouldShowOrgInTeamLabels(teams: ActiveTeamOption[]): boolean {
  if (teams.length <= 1) return false;
  const orgs = new Set(teams.map((t) => t.organizationName));
  return orgs.size > 1;
}

/** 隊伍選單顯示文字（註解：多組織時為「組織 · 隊名」）。 */
export function formatActiveTeamOptionLabel(team: ActiveTeamOption, showOrg: boolean): string {
  if (showOrg && team.organizationName.trim()) {
    return `${team.organizationName} · ${team.name}`;
  }
  return team.name;
}

/** 目前隊伍在頂欄的短標（註解：手機 header 用，優先顯示隊名）。 */
export function formatActiveTeamHeaderTitle(
  team: ActiveTeamOption | undefined,
  fallbackName: string,
): string {
  return team?.name ?? fallbackName;
}

/** 目前隊伍在頂欄的副標（註解：多組織時補組織名）。 */
export function formatActiveTeamHeaderSubtitle(
  team: ActiveTeamOption | undefined,
  suffix: string,
  showOrg: boolean,
): string {
  if (showOrg && team?.organizationName.trim()) {
    return `${team.organizationName} · ${suffix}`;
  }
  return suffix;
}
