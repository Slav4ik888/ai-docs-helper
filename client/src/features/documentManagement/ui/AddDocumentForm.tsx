import { FormEvent, useRef, useState } from 'react';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Card } from '@shared/ui/Card';

interface Props {
  onAddLink: (url: string, title?: string) => Promise<void>;
  onAddFile: (file: File) => Promise<void>;
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-brand-600 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function AddDocumentForm({ onAddLink, onAddFile }: Props) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseUrls = (value: string) => {
    const matches = value.match(/https?:\/\/[^\s]+/gi) || [];
    return [...new Set(matches.map((item) => item.trim()).filter(Boolean))];
  };

  async function handleAddLink(e: FormEvent) {
    e.preventDefault();
    const urls = parseUrls(url);
    if (!urls.length) return;
    setBusy(true);
    setBusyMessage('Добавляю документы и индексирую содержимое…');
    setError(null);
    try {
      const results = await Promise.allSettled(urls.map((item) => onAddLink(item)));
      const failed = results.filter((result) => result.status === 'rejected');
      const succeeded = results.length - failed.length;
      setUrl('');
      if (failed.length && succeeded) {
        setError(`Добавлено ${succeeded} ссылок, ${failed.length} пропущено`);
      } else if (failed.length) {
        setError('Не удалось добавить выбранные ссылки');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось добавить ссылку');
    } finally {
      setBusy(false);
      setBusyMessage('');
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    setBusyMessage('Загружаю файлы и индексирую содержимое…');
    setError(null);
    try {
      const results = await Promise.allSettled(files.map((file) => onAddFile(file)));
      const failed = results.filter((result) => result.status === 'rejected');
      const succeeded = results.length - failed.length;
      if (fileRef.current) fileRef.current.value = '';
      if (failed.length && succeeded) {
        setError(`Загружено ${succeeded} файлов, ${failed.length} пропущено из-за неподходящего формата`);
      } else if (failed.length) {
        setError('Не удалось загрузить выбранные файлы');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить файл');
    } finally {
      setBusy(false);
      setBusyMessage('');
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <form onSubmit={handleAddLink} className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Ссылка на Google Docs</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Вставьте одну или несколько ссылок через пробел, таб или перенос строки"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={busy}
            className="sm:min-h-24"
          />
          <Button type="submit" disabled={busy || !url.trim()} className="shrink-0">
            {busy ? <Spinner /> : 'Добавить'}
          </Button>
        </div>
      </form>

      <div className="border-t border-slate-100 pt-3">
        <label className="text-sm font-medium text-slate-700 block mb-2">Загрузить файл (PDF / Word)</label>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          disabled={busy}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:text-brand-700 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-brand-100 disabled:opacity-50"
        />
      </div>

      {busy && (
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
          <Spinner />
          <span>{busyMessage}</span>
        </div>
      )}

      {error && <div className="text-sm text-red-600">{error}</div>}
    </Card>
  );
}
