'use client';

import { Loader2 } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <Loader2
      className={cn(
        'animate-spin text-muted-foreground',
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  'data-testid'?: string;
}

export function LoadingSkeleton({
  className,
  lines = 1,
  'data-testid': testId,
}: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)} data-testid={testId}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-gray-200 rounded animate-pulse',
            i === lines - 1 && lines > 1 ? 'h-4 w-3/4' : 'h-4 w-full'
          )}
        />
      ))}
    </div>
  );
}

interface LoadingCardProps {
  className?: string;
  'data-testid'?: string;
}

export function LoadingCard({
  className,
  'data-testid': testId,
}: LoadingCardProps) {
  return (
    <div
      className={cn(
        'border border-gray-200 rounded-lg p-6 space-y-4',
        className
      )}
      data-testid={testId}
    >
      <div className='flex items-center space-x-4'>
        <div className='bg-gray-200 rounded-full h-12 w-12 animate-pulse' />
        <div className='space-y-2 flex-1'>
          <div className='bg-gray-200 rounded h-4 w-3/4 animate-pulse' />
          <div className='bg-gray-200 rounded h-3 w-1/2 animate-pulse' />
        </div>
      </div>
      <div className='space-y-2'>
        <div className='bg-gray-200 rounded h-3 w-full animate-pulse' />
        <div className='bg-gray-200 rounded h-3 w-4/5 animate-pulse' />
      </div>
    </div>
  );
}

interface LoadingListProps {
  items?: number;
  className?: string;
  'data-testid'?: string;
}

export function LoadingList({
  items = 5,
  className,
  'data-testid': testId,
}: LoadingListProps) {
  return (
    <div className={cn('space-y-4', className)} data-testid={testId}>
      {Array.from({ length: items }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}

interface LoadingPageProps {
  title?: string;
  description?: string;
}

export function LoadingPage({
  title = 'データを読み込み中...',
  description,
}: LoadingPageProps) {
  return (
    <div className='flex flex-col items-center justify-center py-12 text-center'>
      <LoadingSpinner size='xl' className='mb-4' />
      <h3 className='text-lg font-semibold mb-2'>{title}</h3>
      {description && <p className='text-muted-foreground'>{description}</p>}
    </div>
  );
}

interface LoadingButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingButton({
  children,
  loading = false,
  disabled = false,
  className,
  onClick,
  variant = 'default',
  size = 'md',
}: LoadingButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive:
      'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 py-2 px-4',
    lg: 'h-11 px-8',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <LoadingSpinner size='sm' className='mr-2' />}
      {children}
    </button>
  );
}

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({
  show,
  message = '処理中...',
  className,
}: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm',
        className
      )}
    >
      <div className='bg-white rounded-lg p-6 text-center min-w-[200px]'>
        <LoadingSpinner size='lg' className='mx-auto mb-4' />
        <p className='text-lg font-medium'>{message}</p>
      </div>
    </div>
  );
}
