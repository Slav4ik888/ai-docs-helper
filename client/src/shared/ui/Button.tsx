import { ButtonHTMLAttributes } from 'react';
import { cn } from '@shared/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

const styles: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-600/50',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:opacity-50',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  danger: 'bg-red-50 text-red-700 hover:bg-red-100',
};

export function Button({ variant = 'primary', className, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed',
        styles[variant],
        className,
      )}
    />
  );
}
