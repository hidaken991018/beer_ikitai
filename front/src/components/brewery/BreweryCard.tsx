/**
 * Brewery Card Component
 *
 * このファイルは醸造所情報を表示するカードコンポーネントを提供します。
 * 標準版とコンパクト版の2つのバリエーションがあります。
 *
 * @since v1.0.0
 */

'use client';

import { MapPin, Clock } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { BreweryCardProps } from '@/types/brewery';

/**
 * 醸造所情報カードコンポーネント（標準版）
 *
 * @description 醸造所の詳細情報を表示するメインカードコンポーネントです。
 * 名前、住所、説明、距離、登録日を含み、チェックインと詳細表示のアクションを提供します。
 *
 * @param props - 醸造所カードのプロパティ
 * @returns 醸造所情報カードコンポーネント
 *
 * @example
 * ```tsx
 * <BreweryCard
 *   brewery={{
 *     id: 42,
 *     name: "山田醸造所",
 *     address: "東京都渋谷区恵比寿1-2-3",
 *     description: "伝統的な製法で作る地ビール専門店",
 *     latitude: 35.6462,
 *     longitude: 139.7103,
 *     createdAt: "2024-01-10T09:00:00Z",
 *     updatedAt: "2024-01-15T14:30:00Z"
 *   }}
 *   distance={1.2}
 *   onCheckin={(id) => handleCheckin(id)}
 *   onViewDetails={(id) => router.push(`/brewery/${id}`)}
 * />
 * ```
 */
export function BreweryCard({
  brewery,
  distance,
  onCheckin,
  onViewDetails,
}: BreweryCardProps) {
  /**
   * チェックインボタンのクリックハンドラー
   */
  const handleCheckin = () => {
    onCheckin?.(brewery.id);
  };

  /**
   * 詳細表示ボタンのクリックハンドラー
   */
  const handleViewDetails = () => {
    onViewDetails?.(brewery.id);
  };

  /**
   * 距離を適切な単位でフォーマットする
   *
   * @param distanceKm - キロメートル単位の距離
   * @returns フォーマットされた距離文字列（1km未満はメートル表示）
   */
  const formatDistance = (distanceKm?: number): string => {
    if (distanceKm === undefined) return '';

    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else {
      return `${distanceKm.toFixed(1)}km`;
    }
  };

  /**
   * 日付文字列を日本語形式でフォーマットする
   *
   * @param dateString - ISO 8601形式の日付文字列
   * @returns 日本語形式の日付文字列（例: "2024年1月10日"）
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className='w-full max-w-sm hover:shadow-lg transition-shadow duration-200'>
      <CardHeader className='pb-3'>
        <div className='flex justify-between items-start'>
          <CardTitle className='text-lg font-semibold line-clamp-2'>
            {brewery.name}
          </CardTitle>
          {distance !== undefined && (
            <div className='flex items-center text-sm text-muted-foreground ml-2'>
              <MapPin className='h-4 w-4 mr-1' />
              {formatDistance(distance)}
            </div>
          )}
        </div>
        {brewery.address && (
          <CardDescription className='text-sm text-muted-foreground line-clamp-2'>
            {brewery.address}
          </CardDescription>
        )}
      </CardHeader>

      {brewery.description && (
        <CardContent className='pt-0'>
          <p className='text-sm text-gray-600 line-clamp-3'>
            {brewery.description}
          </p>
        </CardContent>
      )}

      <CardFooter className='flex flex-col space-y-3 pt-3'>
        <div className='flex justify-between items-center w-full text-xs text-muted-foreground'>
          <div className='flex items-center'>
            <Clock className='h-3 w-3 mr-1' />
            登録日: {formatDate(brewery.createdAt)}
          </div>
          <div>ID: {brewery.id}</div>
        </div>

        <div className='flex space-x-2 w-full'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleViewDetails}
            className='flex-1'
          >
            詳細を見る
          </Button>
          <Button size='sm' onClick={handleCheckin} className='flex-1'>
            チェックイン
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * 醸造所情報コンパクトカードコンポーネント
 *
 * @description リスト表示用のコンパクトな醸造所カードコンポーネントです。
 * 標準版よりもコンパクトなレイアウトで、一列で多くの情報を表示できます。
 *
 * @param props - 醸造所カードのプロパティ
 * @returns コンパクトな醸造所情報カードコンポーネント
 *
 * @example
 * ```tsx
 * <BreweryCardCompact
 *   brewery={brewery}
 *   distance={0.8}
 *   onCheckin={(id) => handleCheckin(id)}
 *   onViewDetails={(id) => router.push(`/brewery/${id}`)}
 * />
 * ```
 */
export function BreweryCardCompact({
  brewery,
  distance,
  onCheckin,
  onViewDetails,
}: BreweryCardProps) {
  /**
   * チェックインボタンのクリックハンドラー
   */
  const handleCheckin = () => {
    onCheckin?.(brewery.id);
  };

  /**
   * 詳細表示ボタンのクリックハンドラー
   */
  const handleViewDetails = () => {
    onViewDetails?.(brewery.id);
  };

  /**
   * 距離を適切な単位でフォーマットする
   *
   * @param distanceKm - キロメートル単位の距離
   * @returns フォーマットされた距離文字列（1km未満はメートル表示）
   */
  const formatDistance = (distanceKm?: number): string => {
    if (distanceKm === undefined) return '';

    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else {
      return `${distanceKm.toFixed(1)}km`;
    }
  };

  return (
    <Card className='w-full hover:shadow-md transition-shadow duration-200'>
      <CardContent className='p-4'>
        <div className='flex justify-between items-start'>
          <div className='flex-1 min-w-0'>
            <h3 className='font-semibold text-base line-clamp-1 mb-1'>
              {brewery.name}
            </h3>
            {brewery.address && (
              <p className='text-sm text-muted-foreground line-clamp-1 mb-2'>
                {brewery.address}
              </p>
            )}
            <div className='flex items-center space-x-4 text-xs text-muted-foreground'>
              {distance !== undefined && (
                <div className='flex items-center'>
                  <MapPin className='h-3 w-3 mr-1' />
                  {formatDistance(distance)}
                </div>
              )}
              <div className='flex items-center'>
                <Clock className='h-3 w-3 mr-1' />
                {new Date(brewery.createdAt).toLocaleDateString('ja-JP')}
              </div>
            </div>
          </div>

          <div className='flex space-x-2 ml-4'>
            <Button variant='outline' size='sm' onClick={handleViewDetails}>
              詳細
            </Button>
            <Button size='sm' onClick={handleCheckin}>
              チェックイン
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
