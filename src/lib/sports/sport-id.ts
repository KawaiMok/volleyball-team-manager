/** 運動識別（註解：與 Prisma `Sport` enum 字串一致；client 安全、不 import generated）。 */
export const SPORT_IDS = ["VOLLEYBALL", "SOCCER", "BASKETBALL"] as const;

export type SportId = (typeof SPORT_IDS)[number];

export function isSportId(value: string): value is SportId {
  return (SPORT_IDS as readonly string[]).includes(value);
}
