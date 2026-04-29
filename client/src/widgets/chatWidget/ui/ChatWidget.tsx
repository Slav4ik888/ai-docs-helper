import { useEffect, useRef } from 'react';
import { Card } from '@shared/ui/Card';
import { ChatInput, ChatMessage, useChat } from '@features/chat';

export function ChatWidget() {
  const { messages, pending, sendMessage } = useChat();
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, pending]);

  return (
    <Card className="flex flex-col h-[70vh] min-h-[420px]">
      <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
        {messages.length === 0 && (
          <div className="text-sm text-slate-500 text-center py-12">
            Привет! Задайте вопрос по документам компании.
            <br />
            Например: «Какие фото нужны для фотоотчёта по магистральным каналам?»
          </div>
        )}
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}
        {pending && (
          <div className="text-xs text-slate-400 italic">Поиск ответа…</div>
        )}
      </div>
      <div className="border-t border-slate-200 p-3 bg-white rounded-b-lg">
        <ChatInput onSend={sendMessage} disabled={pending} />
      </div>
    </Card>
  );
}
