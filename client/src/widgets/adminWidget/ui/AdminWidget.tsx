import { Card } from '@shared/ui/Card';
import { Button } from '@shared/ui/Button';
import { AddDocumentForm, DocumentList, useDocuments } from '@features/documentManagement';
import { usePinGuard } from '@features/pinGuard';

export function AdminWidget() {
  const { documents, loading, addLink, addFile, deleteDocument, refetch } = useDocuments();
  const { logout } = usePinGuard();

  return (
    <div className="space-y-4">
      <Card className="p-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-slate-900">Управление документами</div>
          <div className="text-xs text-slate-500">
            Загрузите PDF/Word или добавьте ссылку на Google Docs. Изменения сразу попадают в индекс.
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={refetch}>
            Обновить
          </Button>
          <Button variant="ghost" onClick={logout}>
            Выйти
          </Button>
        </div>
      </Card>

      <AddDocumentForm onAddLink={addLink} onAddFile={addFile} />

      <DocumentList documents={documents} loading={loading} onDelete={deleteDocument} />
    </div>
  );
}
