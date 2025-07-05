'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import React, { Component, ErrorInfo, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className='min-h-[400px] flex items-center justify-center p-4'>
          <Card className='w-full max-w-lg border-red-200'>
            <CardHeader className='text-center'>
              <div className='mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center'>
                <AlertTriangle className='h-6 w-6 text-red-600' />
              </div>
              <CardTitle className='text-red-800'>
                エラーが発生しました
              </CardTitle>
              <CardDescription>
                申し訳ございませんが、予期しないエラーが発生しました。
                ページを再読み込みするか、ホームページに戻ってください。
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className='bg-gray-50 p-4 rounded-lg'>
                  <h4 className='font-semibold text-sm mb-2'>開発者情報:</h4>
                  <pre className='text-xs text-gray-600 overflow-auto max-h-32'>
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              <div className='flex flex-col sm:flex-row gap-2'>
                <Button
                  onClick={this.handleRetry}
                  className='flex-1'
                  variant='default'
                >
                  <RefreshCw className='h-4 w-4 mr-2' />
                  再試行
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className='flex-1'
                  variant='outline'
                >
                  <Home className='h-4 w-4 mr-2' />
                  ホームに戻る
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);

    if (process.env.NODE_ENV === 'production') {
      // Log to error reporting service in production
      // Example: logErrorToService(error, errorInfo);
    }
  };
}
