import type { Message } from '@entities/message';
import { SourcesList } from './SourcesList';
import { cn } from '@shared/lib/cn';

interface Props {
  message: Message;
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words',
          isUser
            ? 'bg-brand-600 text-white rounded-br-sm'
            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm',
        )}
      >
        <div>{message.content}</div>
        {!isUser && message.sources && <SourcesList sources={message.sources} />}
      </div>
    </div>
  );
}
