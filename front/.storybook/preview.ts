import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextjs: {
      appDirectory: true,
      // Next.js 15.3.4 App Router最適化設定
      router: {
        basePath: '',
      },
    },
    docs: {
      defaultName: 'Documentation',
    },
    // Tailwind CSS v4ダークモード対応設定
    backgrounds: {
      options: {
        light: // --background変数に対応
        { name: 'light', value: 'oklch(1 0 0)' },

        dark: // .dark背景色に対応
        { name: 'dark', value: 'oklch(0.145 0 0)' }
      }
    },
    // Tailwind CSS v4カスタムプロパティが正常に機能することを確認
    layout: {
      centered: true,
    },
    // Accessibility addon configuration
    a11y: {
      config: {
        rules: [
          {
            // Enable specific accessibility rules
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'focus-visible',
            enabled: true,
          },
          {
            id: 'aria-*',
            enabled: true,
          },
        ],
      },
      options: {
        checks: { 'color-contrast': { options: { noScroll: true } } },
        restoreScroll: true,
      },
    },
  },

  initialGlobals: {
    backgrounds: {
      value: 'light'
    }
  }
};

export default preview;