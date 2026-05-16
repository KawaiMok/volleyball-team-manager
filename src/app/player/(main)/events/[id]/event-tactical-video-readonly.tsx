/** 球員端：戰術板／影片連結唯讀（註解：與教練端同一批 FileAsset）。 */
export type PlayerTacticalVideoLink = {
  id: string;
  url: string;
  name: string | null;
};

type Props = {
  tactical: PlayerTacticalVideoLink[];
  video: PlayerTacticalVideoLink[];
};

function List({ title, hint, links }: { title: string; hint: string; links: PlayerTacticalVideoLink[] }) {
  if (links.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      <ul className="mt-2 space-y-2">
        {links.map((row) => {
          const label = row.name?.trim() || row.url;
          return (
            <li key={row.id}>
              <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm font-medium text-blue-600 hover:underline"
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function PlayerEventTacticalVideoReadonly({ tactical, video }: Props) {
  if (tactical.length === 0 && video.length === 0) return null;
  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-900 p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">戰術板與影片</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <List title="戰術板" hint="教練整理的白板／戰術連結。" links={tactical} />
        <List title="影片／重播" hint="賽後複習用影片連結。" links={video} />
      </div>
    </section>
  );
}
