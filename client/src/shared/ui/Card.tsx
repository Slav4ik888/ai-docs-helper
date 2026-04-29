import { HTMLAttributes } from 'react';
import { cn } from '@shared/lib/cn';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn('bg-white border border-slate-200 rounded-lg shadow-sm', className)}
    />
  );
}
