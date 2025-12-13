# SETUP

## 1. 必要要件
- Node.js 18+（CI は Node 20 で実行）  
- npm 9+  
- 最新ブラウザ（画面共有のため `getDisplayMedia` 権限が必要）  

## 2. インストール手順
```bash
git clone https://github.com/myooken/p2pShareDisplay
cd p2pShareDisplay
npm install
```

## 3. 開発サーバ起動
```bash
npm run dev
```
- デフォルトで `http://localhost:5173` で起動（`vite --host` なので同一ネットワーク端末からもアクセス可）

## 4. テストの実行
Playwright のブラウザを初回のみ取得します。
```bash
npx playwright install
npm run test
```
- 生成されたレポートは `npx playwright show-report` で確認できます。
