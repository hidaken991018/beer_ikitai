/**
 * Utility Functions
 *
 * このファイルはアプリケーション全体で使用される汎用ユーティリティ関数を提供します。
 * CSS クラス名の結合、文字列処理、型変換などの共通機能を含みます。
 *
 * @since v1.0.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * CSS クラス名を条件付きで結合する関数
 *
 * @description clsx と tailwind-merge を組み合わせて、Tailwind CSS クラス名を
 * 効率的に結合し、重複するクラス名を自動的に解決します。
 *
 * @param inputs - CSS クラス名、配列、オブジェクト、または条件式
 * @returns 結合・最適化されたクラス名文字列
 *
 * @example
 * ```typescript
 * // 基本的な使用方法
 * cn('text-red-500', 'font-bold') // "text-red-500 font-bold"
 *
 * // 条件付きクラス名
 * cn('base-class', {
 *   'text-red-500': isError,
 *   'text-green-500': isSuccess,
 *   'font-bold': isImportant
 * });
 *
 * // Tailwind の競合する宣言を自動解決
 * cn('px-2 py-1 px-3') // "py-1 px-3" (px-2 は px-3 で上書き)
 *
 * // 配列での指定
 * cn(['text-sm', 'text-blue-500'], ['hover:text-blue-700']);
 *
 * // React コンポーネントでの使用
 * <div className={cn(
 *   'rounded-md border',
 *   {
 *     'border-red-500 bg-red-50': variant === 'error',
 *     'border-green-500 bg-green-50': variant === 'success',
 *     'border-gray-300 bg-white': variant === 'default'
 *   },
 *   className // 親からのクラス名をマージ
 * )}>
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
