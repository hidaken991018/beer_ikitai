'use client';

import { Search, Home, ArrowLeft, MapPin } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NotFound() {
  return (
    <AppLayout>
      <div className='min-h-[60vh] flex items-center justify-center'>
        <Card className='w-full max-w-lg text-center'>
          <CardHeader>
            <div className='mx-auto mb-6 h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center'>
              <Search className='h-10 w-10 text-gray-400' />
            </div>
            <CardTitle className='text-3xl font-bold mb-2'>404</CardTitle>
            <CardTitle className='text-xl mb-2'>
              ページが見つかりません
            </CardTitle>
            <CardDescription className='text-base'>
              お探しのページは存在しないか、移動または削除された可能性があります。
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-6'>
            {/* Navigation Options */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <Link href='/'>
                <Button className='w-full' size='lg'>
                  <Home className='h-4 w-4 mr-2' />
                  ホームに戻る
                </Button>
              </Link>

              <Button
                variant='outline'
                className='w-full'
                size='lg'
                onClick={() => window.history.back()}
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                前のページに戻る
              </Button>
            </div>

            {/* Quick Links */}
            <div className='border-t pt-6'>
              <h4 className='font-semibold mb-4'>
                お探しのものはこちらにありませんか？
              </h4>
              <div className='grid grid-cols-1 gap-2'>
                <Link href='/brewery'>
                  <Button variant='ghost' className='w-full justify-start'>
                    <MapPin className='h-4 w-4 mr-2' />
                    醸造所一覧
                  </Button>
                </Link>

                <Link href='/brewery/nearby'>
                  <Button variant='ghost' className='w-full justify-start'>
                    <Search className='h-4 w-4 mr-2' />
                    近隣の醸造所を探す
                  </Button>
                </Link>

                <Link href='/visits'>
                  <Button variant='ghost' className='w-full justify-start'>
                    <Search className='h-4 w-4 mr-2' />
                    訪問履歴
                  </Button>
                </Link>

                <Link href='/profile'>
                  <Button variant='ghost' className='w-full justify-start'>
                    <Search className='h-4 w-4 mr-2' />
                    プロフィール
                  </Button>
                </Link>
              </div>
            </div>

            {/* Help Text */}
            <div className='text-sm text-muted-foreground'>
              <p>URLが正しいかご確認ください。</p>
              <p>問題が解決しない場合は、サポートまでお問い合わせください。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
