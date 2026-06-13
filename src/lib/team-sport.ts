import { Sport } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getSportModule } from "@/lib/sports/registry";
import { prismaSportToId } from "@/lib/sports/registry-server";
import type { SportId } from "@/lib/sports/sport-id";
import type { SportModule } from "@/lib/sports/types";
import { cache } from "react";

/** 同一請求內快取隊伍運動類型 */
export const getTeamSport = cache(async (teamId: string): Promise<Sport | null> => {
  const row = await getPrisma().team.findUnique({
    where: { id: teamId },
    select: { sport: true },
  });
  return row?.sport ?? null;
});

/** 隊伍運動 ID（client 安全字串） */
export async function getTeamSportId(teamId: string): Promise<SportId | null> {
  const sport = await getTeamSport(teamId);
  return sport ? prismaSportToId(sport) : null;
}

/** 隊伍運動 + 外掛模組（註解：server 元件用）。 */
export async function getTeamSportModule(teamId: string): Promise<SportModule | null> {
  const id = await getTeamSportId(teamId);
  return id ? getSportModule(id) : null;
}
