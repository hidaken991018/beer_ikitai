/**
 * ProfileCreateForm Storybook Stories
 *
 * プロフィール作成フォームコンポーネントのStorybookストーリー定義です。
 * 各種状態とインタラクションのテスト用シナリオを提供します。
 *
 * @since v1.0.0
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { action } from 'storybook/actions';
import { within, userEvent, expect, fn } from 'storybook/test';

import { ProfileCreateForm } from './ProfileCreateForm';

/**
 * Storybook メタデータ設定
 *
 * @description コンポーネントのStorybook設定とコントロール定義です。
 * 各プロパティの動的制御とアクションログを提供します。
 */
const meta: Meta<typeof ProfileCreateForm> = {
  title: 'Components/Profile/ProfileCreateForm',
  component: ProfileCreateForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
プロフィール作成フォームコンポーネントです。

## 特徴
- React Hook Form + Zod による型安全なバリデーション
- リアルタイムエラー表示
- アクセシビリティ対応
- ローディング状態の適切な処理

## 使用方法
\`\`\`tsx
<ProfileCreateForm
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isLoading={false}
  error={null}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    onSubmit: {
      description: 'フォーム送信時のコールバック関数',
      action: 'onSubmit',
    },
    onCancel: {
      description: 'キャンセル時のコールバック関数',
      action: 'onCancel',
    },
    isLoading: {
      description: 'ローディング状態フラグ',
      control: 'boolean',
    },
    error: {
      description: 'エラーメッセージ',
      control: 'text',
    },
  },
  args: {
    onSubmit: fn(),
    onCancel: action('onCancel'),
    isLoading: false,
    error: null,
  },
};

export default meta;
type Story = StoryObj<typeof ProfileCreateForm>;

/**
 * デフォルト状態
 *
 * @description 初期状態のフォーム表示です。
 * 空のフィールドと通常の操作状態を確認できます。
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          '基本的なフォーム表示状態です。すべてのフィールドが空で、エラーも表示されていません。',
      },
    },
  },
};

/**
 * 入力済み状態
 *
 * @description フォームに値が入力された状態をシミュレートします。
 * プリフィルされたフォームの表示を確認できます。
 */
export const WithValue: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const displayNameInput = canvas.getByPlaceholderText('ビール太郎');

    await userEvent.type(displayNameInput, 'テストユーザー');
  },
  parameters: {
    docs: {
      description: {
        story:
          'フォームに「テストユーザー」が入力された状態です。ユーザーが実際に入力した際の表示を確認できます。',
      },
    },
  },
};

/**
 * バリデーションエラー状態
 *
 * @description バリデーションエラーが発生した状態を表示します。
 * フィールドレベルのエラー表示とスタイリングを確認できます。
 */
export const ValidationError: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submitButton = canvas.getByRole('button', {
      name: /プロフィールを作成/,
    });

    // 空の状態で送信してバリデーションエラーを発生させる
    await userEvent.click(submitButton);

    // エラーメッセージが表示されることを確認
    const errorMessage = await canvas.findByText('表示名は必須です');
    expect(errorMessage).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story:
          'バリデーションエラーが発生した状態です。必須フィールドが空の場合のエラー表示を確認できます。',
      },
    },
  },
};

/**
 * ローディング状態
 *
 * @description フォーム送信中のローディング状態を表示します。
 * ボタンの無効化とローディングインジケーターを確認できます。
 */
export const Loading: Story = {
  args: {
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'フォーム送信中のローディング状態です。ボタンが無効化され、ローディングインジケーターが表示されます。',
      },
    },
  },
};

/**
 * APIエラー状態
 *
 * @description API呼び出しでエラーが発生した状態を表示します。
 * サーバーエラーメッセージの表示を確認できます。
 */
export const SubmitError: Story = {
  args: {
    error:
      'プロフィールの作成に失敗しました。しばらく時間をおいて再度お試しください。',
  },
  parameters: {
    docs: {
      description: {
        story:
          'API呼び出しでエラーが発生した状態です。エラーメッセージの表示スタイルとアクセシビリティを確認できます。',
      },
    },
  },
};

/**
 * キャンセルボタンなし
 *
 * @description キャンセルボタンが表示されない状態です。
 * onCancelプロパティを指定しない場合の表示を確認できます。
 */
export const WithoutCancel: Story = {
  args: {
    onCancel: undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'キャンセルボタンが表示されない状態です。onCancelプロパティを指定しない場合の表示です。',
      },
    },
  },
};

/**
 * 長い表示名エラー
 *
 * @description 最大文字数を超えた場合のバリデーションエラーを表示します。
 * 文字数制限のエラーメッセージを確認できます。
 */
export const TooLongDisplayName: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const displayNameInput = canvas.getByPlaceholderText('ビール太郎');

    // 51文字の長い文字列を入力（最大50文字を超える）
    const longName = 'a'.repeat(51);
    await userEvent.type(displayNameInput, longName);

    // フィールドからフォーカスを外してバリデーションを発生させる
    await userEvent.tab();

    // エラーメッセージが表示されることを確認
    const errorMessage = await canvas.findByText(
      '表示名は50文字以下で入力してください'
    );
    expect(errorMessage).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story:
          '表示名が最大文字数（50文字）を超えた場合のバリデーションエラーです。',
      },
    },
  },
};

/**
 * インタラクティブテスト
 *
 * @description 実際のユーザー操作をシミュレートするストーリーです。
 * フォームの完全な操作フローを確認できます。
 */
export const Interactive: Story = {
  args: {},
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const displayNameInput = canvas.getByPlaceholderText('ビール太郎');
    const submitButton = canvas.getByRole('button', {
      name: /プロフィールを作成/,
    });

    // 有効な表示名を入力
    await userEvent.type(displayNameInput, 'インタラクティブテストユーザー');

    // 送信ボタンをクリック
    await userEvent.click(submitButton);

    // onSubmitが呼ばれることを確認
    expect(args.onSubmit).toHaveBeenCalledWith({
      display_name: 'インタラクティブテストユーザー',
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          '完全なフォーム操作フローのテストです。入力からsubmitまでの一連の操作を自動実行します。',
      },
    },
  },
};

/**
 * アクセシビリティテスト
 *
 * @description キーボード操作とアクセシビリティ機能をテストします。
 * スクリーンリーダー対応とフォーカス管理を確認できます。
 */
export const AccessibilityTest: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const displayNameInput = canvas.getByPlaceholderText('ビール太郎');

    // フォーカス確認
    await userEvent.click(displayNameInput);
    expect(displayNameInput).toHaveFocus();

    // ラベルとの関連付け確認
    const label = canvas.getByText('表示名 *');
    expect(label).toBeInTheDocument();

    // ARIA属性の確認
    expect(displayNameInput).toHaveAttribute('aria-invalid', 'false');
  },
  parameters: {
    docs: {
      description: {
        story:
          'アクセシビリティ機能のテストです。ラベル関連付け、ARIA属性、フォーカス管理を確認します。',
      },
    },
  },
};
