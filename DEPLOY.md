# Deploying to GitHub Pages

p2pShareDisplay は GitHub Actions で GitHub Pages に自動デプロイする構成になっています。

## 1. GitHub Pages の設定
1. リポジトリの `Settings > Pages` を開き、ソースに **GitHub Actions** を選択する。  
2. `package.json` の `homepage` を実ドメインに更新する（例: `https://myooken.github.io/p2pShareDisplay`）。  
3. `vite.config.js` の `base: './'` と `HashRouter` によりリロード時の 404 を回避済み。

## 2. ビルドコマンド
```bash
npm run build
npm run preview   # 必要に応じてローカル確認
```

## 3. デプロイ方法（GitHub Actions）
1. `main` ブランチに push する。  
2. `.github/workflows/deploy.yml` が走り、Node 20 で `npm ci` → `npm run build` → Pages へアップロード。  
3. 完了すると Pages 環境（`github-pages`）に公開される。

## 4. エラーが出た場合の対処
- **404 / 空白画面**: `homepage` の URL、`base: './'` 設定、Pages のブランチ/ソース設定を確認。  
- **ルーティング不整合**: HashRouter を使うため URL に `#/` が含まれているか確認。  
- **キャッシュ問題**: デプロイ直後はブラウザキャッシュや Pages CDN をクリアする。  
- **Action 失敗**: `npm ci` 失敗時は lockfile を最新にする、Secrets/Permissions の不足を確認する。
