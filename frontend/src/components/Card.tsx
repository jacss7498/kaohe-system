import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({
  children,
  className = '',
  hover = false,
  onClick,
  padding = 'md',
}: CardProps) {
  const baseClasses = 'bg-white rounded-card shadow-card transition-all duration-200';
  const hoverClasses = hover ? 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${clickableClasses} ${paddingClasses[padding]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
