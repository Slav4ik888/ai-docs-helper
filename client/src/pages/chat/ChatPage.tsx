import { ChatWidget } from '@widgets/chatWidget';

export function ChatPage() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Чат с базой знаний</h1>
        <p className="text-sm text-slate-500">
          Ответы основаны на загруженных документах компании. Каждый ответ содержит ссылки на источники.
        </p>
      </div>
      <ChatWidget />
    </div>
  );
}
