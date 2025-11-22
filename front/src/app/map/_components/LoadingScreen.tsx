import { Navigation } from 'lucide-react';

import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { MobileLayout } from '@/components/layout/MobileLayout';

export function LoadingScreen() {
  return (
    <MobileLayout showBottomNav>
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Navigation className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">位置情報を取得中...</p>
        </div>
      </div>
      <BottomNavigation />
    </MobileLayout>
  );
}
