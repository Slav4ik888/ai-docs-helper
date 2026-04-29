import type { Document } from '@entities/document';
import { DocumentCard } from './DocumentCard';

interface Props {
  documents: Document[];
  onDelete: (id: number) => Promise<void> | void;
  loading?: boolean;
}

export function DocumentList({ documents, onDelete, loading }: Props) {
  if (loading && documents.length === 0) {
    return <div className="text-sm text-slate-500">Загрузка…</div>;
  }
  if (documents.length === 0) {
    return (
      <div className="text-sm text-slate-500 border border-dashed border-slate-300 rounded-md p-6 text-center">
        Документов пока нет. Добавьте ссылку на Google Docs или загрузите PDF/Word файл выше.
      </div>
    );
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} onDelete={onDelete} />
      ))}
    </div>
  );
}
