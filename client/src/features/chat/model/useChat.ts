import { useCallback, useState } from 'react';
import { chatApi } from '../api/chatApi';
import type { Message } from '@entities/message';
import { MAX_CHAT_HISTORY } from '@app/config/constants';

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending) return;
      setError(null);

      const userMessage: Message = { id: genId(), role: 'user', content: trimmed };
      const next = [...messages, userMessage];
      setMessages(next);
      setPending(true);

      const history = next
        .slice(-MAX_CHAT_HISTORY)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await chatApi.ask(trimmed, history);
        setMessages((prev) => [
          ...prev,
          { id: genId(), role: 'assistant', content: res.answer, sources: res.sources },
        ]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Ошибка запроса';
        setError(msg);
        setMessages((prev) => [
          ...prev,
          { id: genId(), role: 'assistant', content: `Ошибка: ${msg}` },
        ]);
      } finally {
        setPending(false);
      }
    },
    [messages, pending],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, pending, error, sendMessage, reset };
}
