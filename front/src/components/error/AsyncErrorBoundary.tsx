'use client';

import { AlertCircle, Wifi, RefreshCw } from 'lucide-react';
import React, { Component, ReactNode } from 'react';

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
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error) {
    console.error('AsyncErrorBoundary caught an error:', error);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
    }));

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  getErrorType = (error: Error): 'network' | 'api' | 'unknown' => {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }

    if (
      message.includes('api') ||
      message.includes('server') ||
      message.includes('400') ||
      message.includes('500')
    ) {
      return 'api';
    }

    return 'unknown';
  };

  getErrorMessage = (
    errorType: 'network' | 'api' | 'unknown'
  ): { title: string; description: string; icon: ReactNode } => {
    switch (errorType) {
      case 'network':
        return {
          title: 'ネットワークエラー',
          description: 'インターネット接続を確認して、もう一度お試しください。',
          icon: <Wifi className='h-6 w-6 text-orange-600' />,
        };
      case 'api':
        return {
          title: 'サーバーエラー',
          description:
            'サーバーで問題が発生しています。しばらく時間をおいてから再度お試しください。',
          icon: <AlertCircle className='h-6 w-6 text-red-600' />,
        };
      default:
        return {
          title: 'エラーが発生しました',
          description: '予期しないエラーが発生しました。再度お試しください。',
          icon: <AlertCircle className='h-6 w-6 text-gray-600' />,
        };
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const errorType = this.getErrorType(this.state.error);
      const { title, description, icon } = this.getErrorMessage(errorType);
      const isRetryDisabled = this.state.retryCount >= 3;

      return (
        <div className='flex items-center justify-center p-8'>
          <Card className='w-full max-w-md'>
            <CardHeader className='text-center'>
              <div className='mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center'>
                {icon}
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {process.env.NODE_ENV === 'development' && (
                <div className='bg-gray-50 p-3 rounded text-xs'>
                  <strong>Debug Info:</strong> {this.state.error.message}
                </div>
              )}

              {this.state.retryCount > 0 && (
                <p className='text-sm text-muted-foreground text-center'>
                  再試行回数: {this.state.retryCount}/3
                </p>
              )}

              <div className='flex gap-2'>
                <Button
                  onClick={this.handleRetry}
                  disabled={isRetryDisabled}
                  className='flex-1'
                >
                  <RefreshCw className='h-4 w-4 mr-2' />
                  {isRetryDisabled ? '再試行上限に達しました' : '再試行'}
                </Button>
              </div>

              {errorType === 'network' && (
                <div className='text-xs text-muted-foreground'>
                  <p>• インターネット接続を確認してください</p>
                  <p>
                    • VPNを使用している場合は、一時的に無効にしてみてください
                  </p>
                  <p>• ファイアウォール設定を確認してください</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with async error handling
export function withAsyncErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  onRetry?: () => void
) {
  return function WithAsyncErrorBoundaryComponent(props: P) {
    return (
      <AsyncErrorBoundary onRetry={onRetry}>
        <Component {...props} />
      </AsyncErrorBoundary>
    );
  };
}

// Hook for handling async errors in functional components
export function useAsyncErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const handleError = React.useCallback((error: Error) => {
    console.error('Async error:', error);
    setError(error);
  }, []);

  const retry = React.useCallback(() => {
    setError(null);
    setRetryCount(prev => prev + 1);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  return {
    error,
    retryCount,
    handleError,
    retry,
    resetError,
    canRetry: retryCount < 3,
  };
}
