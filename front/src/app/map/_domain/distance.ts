/**
 * Distance Calculation Domain Logic
 *
 * lib/domain/distance から関数を再エクスポートします。
 * コロケーション戦略に従い、ページ固有の _domain/ ディレクトリから
 * 統一されたドメインロジックを参照します。
 *
 * @deprecated 直接 lib/domain/distance から import することを推奨
 */

export {
  calculateDistance,
  formatDistance,
  calculateDistanceFromCoords,
} from '@/lib/domain/distance';
