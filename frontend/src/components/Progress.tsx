

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  className?: string;
}

export default function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'primary',
  showLabel = false,
  className = '',
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variantClasses = {
    primary: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-500',
    danger: 'bg-danger-600',
  };

  return (
    <div className={className}>
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-gray-600 mt-1 text-right">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}
