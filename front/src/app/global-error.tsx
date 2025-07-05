'use client';

import { AlertTriangle, Home, RefreshCw, Mail } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    // Log the error to console in development
    console.error('Global error occurred:', error);

    // In production, you might want to report this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: reportError(error);
    }
  }, [error]);

  const handleReset = () => {
    try {
      reset();
    } catch (resetError) {
      console.error('Error during reset:', resetError);
      // Fallback: reload the page
      window.location.reload();
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  const getErrorMessage = () => {
    if (
      error?.message?.includes('ChunkLoadError') ||
      error?.message?.includes('Loading chunk')
    ) {
      return {
        title: 'アプリケーションの更新が必要です',
        description:
          'アプリケーションが更新されました。ページを再読み込みしてください。',
        type: 'update' as const,
      };
    }

    if (
      error?.message?.includes('Network') ||
      error?.message?.includes('fetch')
    ) {
      return {
        title: 'ネットワークエラー',
        description: 'インターネット接続を確認して、もう一度お試しください。',
        type: 'network' as const,
      };
    }

    return {
      title: '予期しないエラーが発生しました',
      description:
        'アプリケーションで問題が発生しました。お困りの場合はサポートまでご連絡ください。',
      type: 'general' as const,
    };
  };

  const { title, description, type } = getErrorMessage();

  return (
    <html>
      <body className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <Card className='w-full max-w-2xl border-red-200'>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-6 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center'>
              <AlertTriangle className='h-8 w-8 text-red-600' />
            </div>
            <CardTitle className='text-2xl text-red-800 mb-2'>
              {title}
            </CardTitle>
            <CardDescription className='text-base'>
              {description}
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-6'>
            {/* Error Details for Development */}
            {process.env.NODE_ENV === 'development' && (
              <div className='bg-gray-100 p-4 rounded-lg'>
                <h4 className='font-semibold text-sm mb-2'>開発者情報:</h4>
                <div className='text-xs text-gray-700 space-y-1'>
                  {error.digest && (
                    <p>
                      <strong>Error ID:</strong> {error.digest}
                    </p>
                  )}
                  <p>
                    <strong>Message:</strong> {error.message}
                  </p>
                  {error.stack && (
                    <details className='mt-2'>
                      <summary className='cursor-pointer font-medium'>
                        Stack Trace
                      </summary>
                      <pre className='mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-32'>
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {type === 'update' ? (
                <Button onClick={handleReload} className='w-full' size='lg'>
                  <RefreshCw className='h-4 w-4 mr-2' />
                  ページを再読み込み
                </Button>
              ) : (
                <Button onClick={handleReset} className='w-full' size='lg'>
                  <RefreshCw className='h-4 w-4 mr-2' />
                  再試行
                </Button>
              )}

              <Link href='/' className='w-full'>
                <Button variant='outline' className='w-full' size='lg'>
                  <Home className='h-4 w-4 mr-2' />
                  ホームに戻る
                </Button>
              </Link>
            </div>

            {/* Additional Help */}
            <div className='border-t pt-6'>
              <h4 className='font-semibold mb-3'>お困りの場合</h4>
              <div className='space-y-2 text-sm text-muted-foreground'>
                <p>• ブラウザを最新版に更新してください</p>
                <p>• ブラウザのキャッシュをクリアしてみてください</p>
                <p>• 他のブラウザで試してみてください</p>
                <p>
                  •
                  それでも問題が解決しない場合は、下記からサポートにご連絡ください
                </p>
              </div>

              <div className='mt-4'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    const subject = `エラーレポート - ${error?.message?.substring(0, 50) || '未知のエラー'}`;
                    const body = `エラーが発生しました。\n\nエラーメッセージ: ${error.message}\nエラーID: ${error.digest || 'N/A'}\nURL: ${window.location.href}\nユーザーエージェント: ${navigator.userAgent}\n\n詳細な説明:`;
                    window.open(
                      `mailto:support@mybeerlog.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                    );
                  }}
                >
                  <Mail className='h-4 w-4 mr-2' />
                  サポートに連絡
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </body>
    </html>
  );
}
