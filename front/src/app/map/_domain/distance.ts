/**
 * Distance Calculation Domain Logic
 *
 * 距離計算に関する純粋関数を提供します。
 * Haversine formula を使用した地理的距離計算を実装しています。
 */

/**
 * 2点間の距離を計算する（Haversine formula）
 *
 * @description 地球を完全な球体として仮定し、2つの地点間の最短距離を計算します。
 * 結果はメートル単位で返されます。
 *
 * @param lat1 - 地点1の緯度（度数）
 * @param lng1 - 地点1の経度（度数）
 * @param lat2 - 地点2の緯度（度数）
 * @param lng2 - 地点2の経度（度数）
 * @returns 2点間の距離（メートル）
 *
 * @example
 * ```typescript
 * // 東京駅から大阪駅までの距離
 * const distance = calculateDistance(35.6812, 139.7671, 34.7024, 135.4959);
 * console.log(distance); // 約403,000メートル（403km）
 * ```
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // 地球の半径（メートル）
  const φ1 = (lat1 * Math.PI) / 180; // 緯度1をラジアンに変換
  const φ2 = (lat2 * Math.PI) / 180; // 緯度2をラジアンに変換
  const Δφ = ((lat2 - lat1) * Math.PI) / 180; // 緯度差
  const Δλ = ((lng2 - lng1) * Math.PI) / 180; // 経度差

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 距離（メートル）
}

/**
 * 距離を人間が読みやすい形式にフォーマットする
 *
 * @description 距離に応じて適切な単位（メートルまたはキロメートル）で表示します。
 * - 1km未満: "XXXm"（整数で表示）
 * - 1km以上: "X.Xkm"（小数点第1位まで表示）
 *
 * @param meters - 距離（メートル）
 * @returns フォーマットされた距離文字列
 *
 * @example
 * ```typescript
 * formatDistance(500);    // "500m"
 * formatDistance(1234);   // "1.2km"
 * formatDistance(10567);  // "10.6km"
 * ```
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
