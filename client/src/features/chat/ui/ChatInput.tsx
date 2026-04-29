import { FormEvent, KeyboardEvent, useState } from 'react';
import { Button } from '@shared/ui/Button';

interface Props {
  onSend: (text: string) => Promise<void> | void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const t = value.trim();
    if (!t) return;
    setValue('');
    await onSend(t);
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        rows={2}
        placeholder="Задайте вопрос по документам компании…"
        disabled={disabled}
        className="flex-1 resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-slate-50"
      />
      <Button type="submit" disabled={disabled || !value.trim()}>
        {disabled ? '…' : 'Отправить'}
      </Button>
    </form>
  );
}
