import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'dark' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'gold',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-cinzel rounded-md font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  }[size];

  const variantStyles = {
    gold: 'btn-gold',
    dark: 'btn-dark',
    outline: 'border border-ouro/40 text-pergaminho hover:border-ouro hover:bg-ouro/10 active:bg-ouro/20',
    danger: 'bg-gradient-to-b from-red-700 to-red-900 text-red-100 border border-red-500/50 hover:from-red-600 hover:to-red-800 shadow-lg shadow-red-950/50',
    ghost: 'text-texto-2 hover:text-pergaminho hover:bg-white/5 active:bg-white/10',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : icon ? (
        <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
