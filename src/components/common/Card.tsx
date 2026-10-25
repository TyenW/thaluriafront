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
  withOrnaments = true,
  className = '',
  ...props
}) => {
  const variantClass = {
    grimorio: 'grimorio-card',
    pergaminho: 'pergaminho-card',
    simple: 'bg-[#151822]/90 border border-[#2b3142]',
  }[variant];

  return (
    <div className={`relative rounded-lg p-5 ${variantClass} ${className}`} {...props}>
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
