import type { StandoutCard } from "@/lib/sports/match/standout";

const CARD_ACCENTS = [
  "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/40",
  "border-sky-200 bg-sky-50/80 dark:border-sky-900 dark:bg-sky-950/40",
  "border-fuchsia-200 bg-fuchsia-50/80 dark:border-fuchsia-900 dark:bg-fuchsia-950/40",
  "border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/40",
  "border-violet-200 bg-violet-50/80 dark:border-violet-900 dark:bg-violet-950/40",
  "border-rose-200 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/40",
];

export type StandoutDisplayCard = {
  key: string;
  title: string;
  subtitle?: string;
  displayName?: string;
  jerseyNumber?: number | null;
  formattedValue?: string;
  matchCount?: number;
  detail?: string;
  empty?: boolean;
};

type Props = {
  matchCards: StandoutCard[];
  attendanceCard?: StandoutDisplayCard;
  matchSampleNote?: string;
};

function toDisplayCard(card: StandoutCard): StandoutDisplayCard {
  if ("empty" in card) {
    return { key: card.key, title: card.title, subtitle: card.subtitle, empty: true };
  }
  return {
    key: card.key,
    title: card.title,
    subtitle: card.subtitle,
    displayName: card.displayName,
    jerseyNumber: card.jerseyNumber,
    formattedValue: card.formattedValue,
    matchCount: card.matchCount,
  };
}

/** 表現突出者：榜單卡片（註解：比賽累計＋出席）。 */
export function MatchStandoutCards({ matchCards, attendanceCard, matchSampleNote }: Props) {
  const cards: StandoutDisplayCard[] = [
    ...(attendanceCard ? [attendanceCard] : []),
    ...matchCards.map(toDisplayCard),
  ];

  if (cards.length === 0) {
    return <p className="text-sm text-zinc-500">尚無可顯示的榜單數據。</p>;
  }

  return (
    <div className="space-y-3">
      {matchSampleNote ?
        <p className="text-xs text-zinc-500">{matchSampleNote}</p>
      : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => {
          const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];

          return (
            <div
              key={card.key}
              className={`rounded-xl border p-4 ${card.empty ? "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950" : accent}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{card.title}</p>
              {card.subtitle ?
                <p className="mt-0.5 text-[11px] text-zinc-400">{card.subtitle}</p>
              : null}

              {card.empty ?
                <p className="mt-3 text-sm text-zinc-500">尚無數據</p>
              : (
                <>
                  <p className="mt-3 truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {card.displayName}
                    {card.jerseyNumber != null ?
                      <span className="ml-1 text-xs font-normal text-zinc-500">#{card.jerseyNumber}</span>
                    : null}
                  </p>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {card.formattedValue}
                  </p>
                  {card.matchCount != null ?
                    <p className="mt-1 text-xs text-zinc-500">{card.matchCount} 場比賽數據</p>
                  : card.detail ?
                    <p className="mt-1 text-xs text-zinc-500">{card.detail}</p>
                  : null}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
