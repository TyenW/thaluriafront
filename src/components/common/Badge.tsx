import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'silver' | 'bronze' | 'danger' | 'purple' | 'cyan' | 'muted';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gold',
  size = 'sm',
  className = '',
  icon,
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 tracking-wider',
    md: 'text-xs px-2.5 py-1 tracking-wide',
  }[size];

  const variantStyles = {
    gold: 'bg-amber-950/40 text-amber-300 border-amber-600/40',
    silver: 'bg-slate-900/60 text-slate-200 border-slate-500/40',
    bronze: 'bg-orange-950/40 text-orange-300 border-orange-700/40',
    danger: 'bg-red-950/50 text-red-300 border-red-600/40',
    purple: 'bg-purple-950/50 text-purple-300 border-purple-600/40',
    cyan: 'bg-cyan-950/50 text-cyan-300 border-cyan-600/40',
    muted: 'bg-white/5 text-gray-400 border-white/10',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 font-cinzel font-semibold rounded border uppercase ${sizeStyles} ${variantStyles} ${className}`}
    >
      {icon && <span className="w-3 h-3 flex items-center justify-center">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
