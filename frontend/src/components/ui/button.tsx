import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'w-full py-3 flex items-center justify-center gap-2 text-white font-medium rounded-lg transition-colors bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-gray-400 disabled:cursor-not-allowed',

  secondary:
    'flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50',

  outline:
    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',

  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100',

  destructive:
    'flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50',
};

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}