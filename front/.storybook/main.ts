import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  framework: {
    name: '@storybook/nextjs',
    options: {
      nextConfigPath: '../next.config.ts',
    },
  },
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    {
      name: '@storybook/addon-coverage',
      options: {
        istanbul: {
          include: ['**/src/components/**'],
          exclude: ['**/stories/**', '**/__tests__/**'],
        }
      }
    }
  ],
  docs: {
    defaultName: 'Documentation',
  },
  // staticDirs: ['../public'], // プロジェクトにpublicディレクトリが存在しないためコメントアウト
  typescript: {
    check: false, // パフォーマンス最適化のため無効（開発時はIDEで型チェック）
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
      // Next.js 15.3.4とReact 19に最適化
      compilerOptions: {
        allowSyntheticDefaultImports: false,
        esModuleInterop: false,
      },
    },
  },
};

export default config;