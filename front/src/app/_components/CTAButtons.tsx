'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export function CTAButtons() {
  const router = useRouter();

  return (
    <div className="w-full max-w-[360px] space-y-3">
      <Button
        onClick={() => router.push('/auth/login')}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white h-12 rounded-full font-semibold shadow-lg"
      >
        ログイン / 新規登録
      </Button>

      <button
        onClick={() => router.push('/map')}
        className="w-full text-gray-600 hover:text-amber-600 text-sm font-medium transition-colors"
      >
        ゲストとして地図を見る
      </button>
    </div>
  );
}
