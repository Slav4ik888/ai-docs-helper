import { FormEvent, useRef, useState } from 'react';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Card } from '@shared/ui/Card';

interface Props {
  onAddLink: (url: string, title?: string) => Promise<void>;
  onAddFile: (file: File) => Promise<void>;
}

export function AddDocumentForm({ onAddLink, onAddFile }: Props) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAddLink(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onAddLink(url.trim(), title.trim() || undefined);
      setUrl('');
      setTitle('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось добавить ссылку');
    } finally {
      setBusy(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await onAddFile(file);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить файл');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <form onSubmit={handleAddLink} className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Ссылка на Google Docs</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="https://docs.google.com/document/d/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={busy}
          />
          <Input
            placeholder="Название (необязательно)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
            className="sm:max-w-xs"
          />
          <Button type="submit" disabled={busy || !url.trim()} className="shrink-0">
            {busy ? '…' : 'Добавить'}
          </Button>
        </div>
        <p className="text-xs text-slate-400">
          Документ должен быть опубликован: «Файл → Опубликовать в интернете».
        </p>
      </form>

      <div className="border-t border-slate-100 pt-3">
        <label className="text-sm font-medium text-slate-700 block mb-2">Загрузить файл (PDF / Word)</label>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          disabled={busy}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:text-brand-700 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-brand-100"
        />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
    </Card>
  );
}
