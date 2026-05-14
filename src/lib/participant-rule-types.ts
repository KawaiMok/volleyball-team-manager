/** 事件參與者規則（註解：建立時展開為 EventParticipant + Attendance；純型別供 client 使用）。 */
export type ParticipantRule =
  | { kind: "ALL" }
  | { kind: "SQUADS"; squads: string[] }
  | { kind: "MEMBERS"; memberIds: string[] };
