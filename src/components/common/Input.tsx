import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-cinzel font-semibold uppercase tracking-wider text-[#d4af37]/90 mb-1.5"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-[#9e782f] pointer-events-none flex items-center">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          className={`w-full bg-[#0d0f15]/90 text-[#f3e5ab] placeholder-[#6b7280] rounded border px-3.5 py-2.5 text-sm transition-all outline-none ${
            icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-red-500/80 focus:border-red-400 focus:ring-1 focus:ring-red-500/50'
              : 'border-[#383d4e] hover:border-[#525a70] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/40 focus:shadow-[0_0_12px_rgba(212,175,55,0.2)]'
          } ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-red-400 font-sans-clean flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-[#8c93a4] font-sans-clean">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
