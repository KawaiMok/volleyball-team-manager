import { formatEventWhenWhereShort } from "@/lib/format-event-meta";

type Props = {
  title: string;
  startsAt: Date;
  endsAt: Date;
  locationName?: string | null;
  /** 是否已結束（註解：結束後才顯示簡寫時間地點）。 */
  ended: boolean;
  titleClassName?: string;
  metaClassName?: string;
};

/** 事件標題 + 已結束時的簡寫時間地點（註解：inline、字級較小、次要色）。 */
export function EventTitleWithMeta({
  title,
  startsAt,
  endsAt,
  locationName,
  ended,
  titleClassName = "text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50",
  metaClassName = "text-sm font-normal text-zinc-500 dark:text-zinc-400",
}: Props) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <h1 className={titleClassName}>{title}</h1>
      {ended ?
        <span className={metaClassName}>{formatEventWhenWhereShort(startsAt, endsAt, locationName)}</span>
      : null}
    </div>
  );
}

/** 列表／連結內嵌標題 + 簡寫（註解：教練事件列表等）。 */
export function EventTitleInlineMeta({
  title,
  startsAt,
  endsAt,
  locationName,
  ended,
  titleClassName = "font-medium",
  metaClassName = "text-xs font-normal text-zinc-500 dark:text-zinc-400",
}: Props) {
  if (!ended) {
    return <span className={titleClassName}>{title}</span>;
  }
  return (
    <span className="inline">
      <span className={titleClassName}>{title}</span>
      <span className={`ml-1.5 ${metaClassName}`}>
        {formatEventWhenWhereShort(startsAt, endsAt, locationName)}
      </span>
    </span>
  );
}
