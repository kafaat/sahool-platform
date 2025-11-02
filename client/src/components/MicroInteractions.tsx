/**
 * Micro-interactions Components
 * مكونات التفاعلات الدقيقة
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Ripple Effect Button
 * زر مع تأثير الموجة
 */
interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export function RippleButton({ children, className, variant = 'primary', ...props }: RippleButtonProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 600);

    props.onClick?.(e);
  };

  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50',
    ghost: 'text-neutral-700 hover:bg-neutral-100',
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      className={cn(
        'relative overflow-hidden rounded-lg px-4 py-2 font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        className
      )}
    >
      {children}
      
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
          }}
        />
      ))}
    </button>
  );
}

/**
 * Animated Counter
 * عداد متحرك
 */
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function AnimatedCounter({ 
  value, 
  duration = 1000, 
  suffix = '', 
  prefix = '',
  className 
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  React.useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setDisplayValue(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <span className={cn('font-bold tabular-nums', className)}>
      {prefix}{displayValue.toLocaleString('ar-SA')}{suffix}
    </span>
  );
}

/**
 * Pulse Indicator
 * مؤشر نابض
 */
interface PulseIndicatorProps {
  color?: 'green' | 'yellow' | 'red' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function PulseIndicator({ color = 'green', size = 'md', label }: PulseIndicatorProps) {
  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={cn('rounded-full', colorClasses[color], sizeClasses[size])} />
        <div 
          className={cn(
            'absolute inset-0 rounded-full animate-ping opacity-75',
            colorClasses[color]
          )} 
        />
      </div>
      {label && <span className="text-sm text-neutral-600">{label}</span>}
    </div>
  );
}

/**
 * Progress Ring
 * حلقة التقدم
 */
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showLabel?: boolean;
}

export function ProgressRing({ 
  progress, 
  size = 120, 
  strokeWidth = 8,
  color = 'rgb(54, 124, 43)',
  showLabel = true 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-neutral-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-neutral-900">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Hover Card
 * بطاقة تفاعلية
 */
interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function HoverCard({ children, className, glowColor = 'rgba(54, 124, 43, 0.3)' }: HoverCardProps) {
  return (
    <div
      className={cn(
        'group relative rounded-xl border border-neutral-200 bg-white p-6',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-2 hover:shadow-xl',
        className
      )}
      style={{
        '--glow-color': glowColor,
      } as React.CSSProperties}
    >
      <div 
        className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          boxShadow: `0 20px 40px -10px var(--glow-color)`,
        }}
      />
      {children}
    </div>
  );
}

/**
 * Skeleton Loader
 * محمل هيكلي
 */
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-neutral-200',
        variantClasses[variant],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

/**
 * Tooltip
 * تلميح
 */
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-3 py-2 text-sm text-white bg-neutral-900 rounded-lg',
            'whitespace-nowrap animate-fade-in',
            positionClasses[position]
          )}
        >
          {content}
          <div 
            className="absolute w-2 h-2 bg-neutral-900 transform rotate-45"
            style={{
              [position === 'top' ? 'bottom' : position === 'bottom' ? 'top' : position === 'left' ? 'right' : 'left']: '-4px',
              ...(position === 'top' || position === 'bottom' ? { left: '50%', marginLeft: '-4px' } : { top: '50%', marginTop: '-4px' }),
            }}
          />
        </div>
      )}
    </div>
  );
}

/* Add ripple animation to global CSS */
const rippleStyle = `
@keyframes ripple {
  to {
    width: 500px;
    height: 500px;
    opacity: 0;
    transform: translate(-50%, -50%);
  }
}

.animate-ripple {
  animation: ripple 0.6s ease-out;
}
`;

// Inject style
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = rippleStyle;
  document.head.appendChild(style);
}

export default {
  RippleButton,
  AnimatedCounter,
  PulseIndicator,
  ProgressRing,
  HoverCard,
  Skeleton,
  Tooltip,
};
