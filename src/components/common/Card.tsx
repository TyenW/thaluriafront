import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'grimorio' | 'pergaminho' | 'simple';
  withOrnaments?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'grimorio',
  withOrnaments = false,
  className = '',
  ...props
}) => {
  const variantClass = {
    grimorio: 'grimorio-card',
    pergaminho: 'pergaminho-card',
    simple: 'bg-painel border border-linha',
  }[variant];

  return (
    <div className={`relative rounded-xl p-5 ${variantClass} ${className}`} {...props}>
      {withOrnaments && (
        <>
          <span className="ornament-corner ornament-corner-tl" />
          <span className="ornament-corner ornament-corner-tr" />
          <span className="ornament-corner ornament-corner-bl" />
          <span className="ornament-corner ornament-corner-br" />
        </>
      )}
      {children}
    </div>
  );
};
