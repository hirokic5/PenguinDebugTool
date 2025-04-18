# Penguin Debug Tool

デバッグ情報の可視化と分析のためのツール。フロントエンドとバックエンドの両方のコンポーネントを含みます。

## 必要条件

- Node.js (v18以上)
- npm (v9以上)

## インストール

```bash
# プロジェクトのクローン
git clone [repository-url]
cd penguin-debug-tool

# 依存関係のインストール
npm install
```

## 開発環境の起動

### バックエンド（Node.js）

```bash
# 開発モードでサーバーを起動
npm run server
```

サーバーはデフォルトで以下のポートで起動します：
- WebSocket Server: `8080`
- HTTP Server: `3000`

### フロントエンド（React + TypeScript）

```bash
# 開発モードでフロントエンドを起動
npm run dev
```

開発サーバーは `http://localhost:5173` で起動します。

## ビルドと本番環境

```bash
# フロントエンドのビルド
npm run build

# 本番環境での実行
npm run start
```

## プロジェクト構造

```
penguin-debug-tool/
├── src/                    # フロントエンドのソースコード
│   ├── components/        # Reactコンポーネント
│   ├── hooks/            # カスタムフック
│   └── types/            # TypeScript型定義
├── server.js              # バックエンドサーバー
├── cli-monitor.js         # CLIモニタリングツール
├── public/                # 静的ファイル
├── dist/                  # ビルド出力（git管理対象外）
├── node_modules/          # 依存関係（git管理対象外）
├── package.json           # プロジェクト設定と依存関係
├── tsconfig.json          # TypeScript設定
└── vite.config.ts         # Vite設定
```

## 主な機能

1. リアルタイムデバッグ情報の表示
2. WebSocketを使用したライブアップデート
3. デバッグデータの可視化
4. CLIツールとの連携

## 開発ガイドライン

### コード規約

- TypeScriptの型を適切に使用する
- コンポーネントは機能ごとに分割する
- 再利用可能なロジックはカスタムフックとして実装する

### Git管理

以下のファイルは`.gitignore`に含まれており、バージョン管理対象外です：

- `node_modules/`
- `dist/`
- `.env`ファイル
- エディタ設定（`.vscode/`, `.idea/`）
- ログファイル
- OS固有のファイル（`.DS_Store`等）

## 環境変数

`.env`ファイルで以下の環境変数を設定できます：

```env
# サーバー設定
PORT=3000
WS_PORT=8080

# 開発設定
VITE_DEV_SERVER_PORT=5173
```

## トラブルシューティング

1. **サーバー起動エラー**
   - ポートが既に使用されていないか確認
   - 必要な依存関係がインストールされているか確認

2. **ビルドエラー**
   - TypeScriptのエラーを確認
   - 依存関係が最新かチェック

## ライセンス

[ライセンス情報を追加]