import { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'gray';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  dot?: boolean;
}

export default function Badge({
  children,
  variant = 'gray',
  size = 'md',
  className = '',
  dot = false,
}: BadgeProps) {
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-success-100 text-success-700',
    warning: 'bg-warning-100 text-warning-600',
    danger: 'bg-danger-100 text-danger-700',
    gray: 'bg-gray-100 text-gray-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const dotColors = {
    primary: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-500',
    danger: 'bg-danger-600',
    gray: 'bg-gray-600',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[variant]}`}></span>}
      {children}
    </span>
  );
}
