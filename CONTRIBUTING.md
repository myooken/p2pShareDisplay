# Contributing Guide

## 基本方針
- 小さな変更単位で PR を作成してください
- 挙動変更がある場合は先に Issue を立ててください
- P2P / 非保存の設計思想を尊重してください

## 開発手順
```bash
npm install
npm run dev
```
Playwright のブラウザバイナリが必要な場合は README のセットアップ手順を参照してください。

## コーディングルール
- TypeScript / ESLint の警告は原則ゼロ
- 意図が分かりにくい処理には短いコメントを追加
- セキュリティ・プライバシーに関わる処理は特に慎重にレビュー

## テスト
```bash
npm run test
```
(ローカル Peer サーバー付きで自動起動します)
