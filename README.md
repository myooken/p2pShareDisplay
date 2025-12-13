# p2pShareDisplay

## 1. プロジェクト概要（What）
このアプリは、ブラウザだけで手軽に画面共有を行うための実験的 Web アプリケーションです。PeerJS を使った P2P 通信で、ホストの画面をゲストへリアルタイム配信します。

## 2. 特徴（Features）
- ルーム作成 / 参加と任意パスワードによる簡易認証
- 画面共有（音声オン/オフ切替対応）とホスト側の共有開始/停止制御
- 共有 URL のコピーと QR コード表示でモバイルからも参加しやすい
- ゲストカーソルの共有（常時 or クリック時）とカラー選択
- ダーク / ライト切替、PiP・フルスクリーン切替、デバッグログトグル
- HashRouter + `base: './'` で GitHub Pages デプロイに対応

## 3. デモURL（GitHub Pages）
https://myooken.github.io/p2pShareDisplay

## 4. 技術スタック（Tech Stack）
- React 19 / Vite
- React Router DOM
- PeerJS (WebRTC ベースの P2P 通信)
- lucide-react / qrcode.react
- Playwright（E2E） / GitHub Actions（Pages デプロイ）

## 5. セットアップ / 環境構築（Install）
```bash
npm install
npm run dev
```
詳細手順や Playwright のブラウザ準備は [SETUP.md](./SETUP.md) を参照してください。

## 6. ビルド方法（Build）
```bash
npm run build
```

## 7. デプロイ方法（Deploy）
- `main` への push で `.github/workflows/deploy.yml` が GitHub Pages へビルド & デプロイ
- 手順やトラブルシュートは [DEPLOY.md](./DEPLOY.md) を参照
