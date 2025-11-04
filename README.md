# Morilab Admin

Morilab管理画面用のNext.jsプロジェクトです。

## 概要

このプロジェクトは、メインプロジェクト（`../morilab`）のCSVデータを管理するためのツールです。

- IPアドレス制限 + パスワード認証（2段階認証）
- CSVファイルの読み込み・編集・保存
- メインプロジェクトのビルド実行

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **認証**: JWT (jose)
- **CSV処理**: csv-parse, csv-stringify

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成し、環境変数を設定してください。

```bash
cp .env.example .env
```

`.env`ファイルに以下を設定：

- `AUTH_SECRET`: JWT署名用の秘密鍵
- `ADMIN_PASSWORD`: 管理画面のパスワード
- `ALLOWED_IPS`: 許可IPアドレス（カンマ区切り）

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000/admin/login](http://localhost:3000/admin/login) を開いて管理画面にアクセスできます。

## ディレクトリ構造

```
morilab_admin/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── (auth)/
│   │   │   │   └── login/          # 認証前のログイン画面
│   │   │   └── (authed)/
│   │   │       └── edit/           # 認証後の編集画面
│   │   ├── api/
│   │   │   └── admin/              # APIエンドポイント
│   │   │       ├── login/          # ログイン
│   │   │       ├── logout/         # ログアウト
│   │   │       ├── status/         # ステータス確認
│   │   │       ├── csv/            # CSV読み込み・保存
│   │   │       └── build/          # ビルド実行
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── lib/
│       ├── auth.ts                 # 認証システム
│       └── config.ts               # メインプロジェクトのパス設定
├── .env.example
└── package.json
```

## 機能

### 認証システム

- **IPアドレス制限**: 環境変数`ALLOWED_IPS`で許可されたIPアドレスのみアクセス可能
- **パスワード認証**: 環境変数`ADMIN_PASSWORD`で設定されたパスワードが必要
- **JWTトークン**: 認証成功後、JWTトークンが発行され、24時間有効

### CSV管理

以下のCSVファイルを編集・保存できます：

- `../morilab/data/members.csv`
- `../morilab/data/news.csv`
- `../morilab/data/publications.csv`

### ビルド実行

メインプロジェクトのビルドを実行できます（`../morilab`ディレクトリで`npm run build`を実行）。

## APIエンドポイント

### POST `/api/admin/login`

ログイン処理

**リクエスト:**
```json
{
  "password": "your-password"
}
```

**レスポンス:**
```json
{
  "success": true
}
```

### POST `/api/admin/logout`

ログアウト処理

### GET `/api/admin/status`

認証状態とIPアドレス情報を取得

**レスポンス:**
```json
{
  "ip": "127.0.0.1",
  "ipAllowed": true,
  "authenticated": false
}
```

### GET `/api/admin/csv?file={file}`

CSVファイルを読み込む

**パラメータ:**
- `file`: `members`, `news`, `publications`のいずれか

### POST `/api/admin/csv`

CSVファイルを保存

**リクエスト:**
```json
{
  "file": "members",
  "description": "説明行",
  "header": "ヘッダー行",
  "data": [...]
}
```

### POST `/api/admin/build`

メインプロジェクトのビルドを実行

## 開発

### 開発サーバー

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### 本番サーバー起動

```bash
npm start
```

## 注意事項

- この管理画面は開発サーバー（`npm run dev`）で常時起動することを想定しています
- 本番環境では適切なセキュリティ設定を行ってください
- 環境変数は必ず設定し、`.env`ファイルをGitにコミットしないでください

