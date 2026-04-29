import type { Message } from '@entities/message';
import { SourcesList } from './SourcesList';
import { cn } from '@shared/lib/cn';
import ReactMarkdown from 'react-markdown';

interface Props {
  message: Message;
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm break-words',
          isUser
            ? 'bg-brand-600 text-white rounded-br-sm whitespace-pre-wrap'
            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm',
        )}
      >
        {isUser ? (
          <div>{message.content}</div>
        ) : (
          <div className="prose prose-sm max-w-none prose-slate prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded prose-pre:bg-slate-100 prose-pre:p-2 prose-pre:rounded">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        {!isUser && message.sources && <SourcesList sources={message.sources} />}
      </div>
    </div>
  );
}
