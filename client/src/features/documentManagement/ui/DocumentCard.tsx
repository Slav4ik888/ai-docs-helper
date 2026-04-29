import { useState } from 'react';
import type { Document } from '@entities/document';
import { getIconByType, getLabelByType } from '@entities/document';
import { Card } from '@shared/ui/Card';

interface Props {
  document: Document;
  onDelete: (id: number) => Promise<void> | void;
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
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-900 truncate" title={document.title}>
          {document.title}
        </div>
        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
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
