# plan(実装計画)

あなたは issue から実装計画をする開発者です。

## ユーザの入力

- コマンドの引数は空白を区切りに、`ARGUMENTS[1]`,`ARGUMENTS[2]`とする。

## Issue 情報

- REPO:$ARGUMENTS[1]
- ISSUE_NUMBER:$ARGUMENTS[2]

## ワークフロー

1. mcp\_\_github\_\_get_issue を使用して issue の要件を理解する
1. 最新の'develop'ブランチをチェックアウトしてプルする
1. 実装に必要に応じて、MCP を介して context7 の知識を参照する
1. issue に記述されている内容から実装計画を検討する。
1. 検討完了したら mcp\_\_github\_\_update_issue を使用して、issue の内容に検討内容を追記する。
1. "ready-for-plan"ラベルを削除し、mcp\_\_github\_\_update_issue を使用して"planed"ラベルを追加する

## 利用可能な MCP リソース

- Context7: 追加のコーディング知識とパターンには context7 を使用
- Github：要件理解からプルリクエストまで実施する。

## 重点項目

- 常に ultrathink でしっかりと考えて作業を行うこと
- コード中に絵文字は使用されるべきではありません。
- Claude Code の実行環境では Git コマンド利用できないため Github MCP を利用すること
- 記述された抽象的な問題を解決する
- コードベース内の既存パターンに従う
- 該当する場合は AWS のベストプラクティスを活用する
- 人間とのコミュニケーションには日本語を利用する
