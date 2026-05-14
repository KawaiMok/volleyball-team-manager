import { z } from "zod";

/** Zod 驗證（註解：與 `ParticipantRule` 對齊，供 API 共用）。 */
export const participantRuleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("ALL") }),
  z.object({ kind: z.literal("SQUADS"), squads: z.array(z.string()).min(1) }),
  z.object({ kind: z.literal("MEMBERS"), memberIds: z.array(z.string()).min(1) }),
]);
