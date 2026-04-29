import { FormEvent, useState } from 'react';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Card } from '@shared/ui/Card';
import { usePinGuard } from '../model/usePinGuard';

interface Props {
  onSuccess?: () => void;
}

export function PinModal({ onSuccess }: Props) {
  const { verify, isVerifying, error } = usePinGuard();
  const [pin, setPin] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;
    const ok = await verify(pin.trim());
    if (ok) onSuccess?.();
  }

  return (
    <div className="grid place-items-center min-h-[60vh]">
      <Card className="p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Вход в админку</h2>
        <p className="text-sm text-slate-500 mb-4">Введите пин-код для доступа к управлению документами.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            inputMode="numeric"
            placeholder="Пин-код"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
          />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying ? 'Проверка…' : 'Войти'}
          </Button>
          <p className="text-xs text-slate-400">По умолчанию: 1234</p>
        </form>
      </Card>
    </div>
  );
}
