import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@shared/lib/cn';

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(function Input({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      {...rest}
      className={cn(
        'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm',
        'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
        'disabled:bg-slate-50 disabled:text-slate-500',
        className,
      )}
    />
  );
});
