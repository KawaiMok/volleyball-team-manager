/** 球員視角僅需顯示名稱，不回傳 email／clerkUserId 等 PII（註解：教練端仍回完整 user）。 */
const playerUserSelect = { select: { name: true } } as const;

/** 事件詳情 include：依角色決定 user 欄位範圍。 */
export function eventDetailInclude(forCoachSide: boolean) {
  const userInclude = forCoachSide ? { include: { user: true } } : { include: { user: playerUserSelect } };
  return {
    participants: { include: { member: userInclude } },
    attendance: { include: { member: userInclude } },
    trainingPlan: { include: { blocks: { orderBy: { order: "asc" as const } } } },
    feedback: true,
  };
}
