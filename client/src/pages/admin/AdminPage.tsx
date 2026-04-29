import { PinModal, usePinGuard } from '@features/pinGuard';
import { AdminWidget } from '@widgets/adminWidget';

export function AdminPage() {
  const { isAuthorized } = usePinGuard();

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Админ-панель</h1>
        <p className="text-sm text-slate-500">Доступ закрыт пин-кодом.</p>
      </div>
      {isAuthorized ? <AdminWidget /> : <PinModal />}
    </div>
  );
}
