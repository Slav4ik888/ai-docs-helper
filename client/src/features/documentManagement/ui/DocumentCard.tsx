import { useState } from 'react';
import type { Document, IndexStatus } from '@entities/document';
import { getIconByType, getLabelByType } from '@entities/document';
import { Card } from '@shared/ui/Card';

interface Props {
  document: Document;
  onDelete: (id: number) => Promise<void> | void;
}

function StatusBadge({ status, error }: { status: IndexStatus; error: string | null }) {
  if (status === 'ok') {
    return (
      <span
        className="inline-grid place-items-center w-5 h-5 rounded-full text-emerald-600 bg-emerald-50 shrink-0"
        title="Документ успешно проиндексирован"
      >
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
          <path d="M3.5 6l1.8 1.8L8.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span
        className="inline-grid place-items-center w-5 h-5 rounded-full text-red-600 bg-red-50 shrink-0 cursor-help"
        title="Ошибка индексации"
      >
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
          <path d="M6 3.5v3M6 8.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  return (
    <span
      className="inline-grid place-items-center w-5 h-5 rounded-full text-slate-400 bg-slate-100 shrink-0"
      title="Документ ожидает индексации"
    >
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
        <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function DocumentCard({ document, onDelete }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (busy) return;
    if (!confirm(`Удалить «${document.title}»? Это удалит и связанные данные индекса.`)) return;
    setBusy(true);
    try {
      await onDelete(document.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-3 flex items-start gap-3">
      <div className="text-2xl shrink-0">{getIconByType(document.type)}</div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={document.indexStatus ?? 'pending'} error={document.indexError ?? null} />
          <span className="font-medium text-slate-900 truncate" title={document.title}>
            {document.title}
          </span>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>{getLabelByType(document.type)}</span>
          {document.type === 'gdocs' && (
            <a
              href={document.urlOrPath}
              target="_blank"
              rel="noreferrer"
              className="text-brand-600 hover:underline truncate max-w-[16rem]"
            >
              {document.urlOrPath}
            </a>
          )}
        </div>
        {document.indexStatus === 'error' && document.indexError && (
          <div className="text-xs text-red-500 leading-snug">{document.indexError}</div>
        )}
      </div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="shrink-0 w-8 h-8 grid place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        aria-label="Удалить документ"
        title="Удалить"
      >
        ×
      </button>
    </Card>
  );
}
