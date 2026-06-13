import { getSportDisplayName } from "@/lib/sports/sport-options";
import type { SportId } from "@/lib/sports/sport-id";

type Props = {
  sport: SportId;
  /** 功能名稱，例如「場上企位」 */
  featureLabel: string;
};

/** 非排球（或尚未實作）運動的功能占位（註解：外部戰術連結仍可用）。 */
export function SportFeatureComingSoon({ sport, featureLabel }: Props) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-400">
      <p>
        <span className="font-medium text-zinc-800 dark:text-zinc-200">{getSportDisplayName(sport)}</span>
        隊的「{featureLabel}」即將推出。
      </p>
      <p className="mt-2">
        你仍可使用本頁的「戰術板與影片」加入 Excalidraw、Miro 等外部白板連結。
      </p>
    </div>
  );
}
