import { MapPin, Calendar, History } from 'lucide-react';

import { MobileLayout } from '@/components/layout/MobileLayout';

import { AppIcon } from './_components/AppIcon';
import { CTAButtons } from './_components/CTAButtons';
import { FeatureCard } from './_components/FeatureCard';

export default function LandingPage() {
  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center px-6 py-12">
        {/* App Icon */}
        <AppIcon />

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Tap Room Check-in
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-gray-600 mb-8 text-center max-w-[320px]">
          クラフトビールのタップルームへの訪問を記録して、あなたのビール旅を楽しもう
        </p>

        {/* Feature Cards */}
        <div className="w-full max-w-[360px] space-y-4 mb-8">
          <FeatureCard
            icon={MapPin}
            title="近くのタップルームを発見"
            description="地図上で醸造所を探索"
          />
          <FeatureCard
            icon={Calendar}
            title="訪問を記録"
            description="100m以内でチェックイン可能"
          />
          <FeatureCard
            icon={History}
            title="履歴を振り返る"
            description="訪問した醸造所を確認"
          />
        </div>

        {/* CTA Buttons */}
        <CTAButtons />
      </div>
    </MobileLayout>
  );
}
