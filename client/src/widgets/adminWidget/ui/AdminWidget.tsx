import { useState } from 'react';
import { Card } from '@shared/ui/Card';
import { Button } from '@shared/ui/Button';
import { AddDocumentForm, DocumentList, useDocuments } from '@features/documentManagement';
import { usePinGuard } from '@features/pinGuard';

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function AdminWidget() {
  const { documents, loading, addLink, addFile, deleteDocument, rebuild } = useDocuments();
  const { logout } = usePinGuard();
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildError, setRebuildError] = useState<string | null>(null);

  async function handleRebuild() {
    if (rebuilding) return;
    setRebuilding(true);
    setRebuildError(null);
    try {
      await rebuild();
    } catch (e) {
      setRebuildError(e instanceof Error ? e.message : 'Ошибка переиндексации');
    } finally {
      setRebuilding(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-900">Управление документами</div>
            <div className="text-xs text-slate-500">
              Загрузите PDF/Word или добавьте ссылку на Google Docs. Изменения сразу попадают в индекс.
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" onClick={handleRebuild} disabled={rebuilding}>
              {rebuilding ? (
                <span className="flex items-center gap-1.5">
                  <Spinner />
                  Индексирую…
                </span>
              ) : (
                'Переиндексировать'
              )}
            </Button>
            <Button variant="ghost" onClick={logout}>
              Выйти
            </Button>
          </div>
        </div>

        {rebuilding && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-md px-3 py-2">
            <Spinner />
            <span>Перечитываю документы и пересчитываю векторный индекс — это может занять несколько секунд…</span>
          </div>
        )}

        {rebuildError && (
          <div className="text-xs text-red-600 bg-red-50 rounded-md px-3 py-2">{rebuildError}</div>
        )}
      </Card>

      <AddDocumentForm onAddLink={addLink} onAddFile={addFile} />

      <DocumentList documents={documents} loading={loading} onDelete={deleteDocument} />
    </div>
  );
}
