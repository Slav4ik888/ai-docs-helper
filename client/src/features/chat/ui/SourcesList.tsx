import type { Source } from '@entities/message';

interface Props {
  sources: Source[];
}

export function SourcesList({ sources }: Props) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-2 pt-2 border-t border-slate-100">
      <div className="text-xs font-medium text-slate-500 mb-1">Источники:</div>
      <ul className="flex flex-wrap gap-1.5">
        {sources.map((s, i) => (
          <li key={`${s.title}-${i}`}>
            {s.url ? (
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-brand-50 text-brand-700 hover:bg-brand-100"
              >
                🔗 {s.title}
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
                📄 {s.title}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
