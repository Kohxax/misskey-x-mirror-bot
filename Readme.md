# misskey-x-mirror-bot

XのアカウントのツイートをMisskeyの自インスタンスへミラー投稿するbotです。

## 機能

- 指定したXアカウントのツイートを定期取得（5分ごと）してMisskeyに投稿
- 画像の添付に対応
- Misskeyのフォローバック機能付き

## 仕組み

- Xのデータ取得: [`@the-convocation/twitter-scraper`](https://github.com/the-convocation/twitter-scraper)（Cookie認証）
- Misskey投稿: [`misskey-js`](https://github.com/misskey-dev/misskey.js)
- 重複投稿防止: 最後に投稿したツイートIDを`data/store.json`に保存

## セットアップ

### 1. Misskeyのアクセストークンを取得

Misskeyの設定 → API → アクセストークン発行  
必要な権限: **ノートの作成**・**ドライブのファイルを作成・編集・削除する**・**フォローする**

### 2. XのCookieを取得

> ⚠️ 本番運用用のXアカウントではなく、**専用の捨てアカウント**を用意することを強く推奨します。

1. Xに捨てアカでログインした状態でブラウザのDevToolsを開く（F12）
2. Applicationタブ → Cookies → `https://x.com` を開く
3. `auth_token` と `ct0` の値をそれぞれコピーする

### 3. 環境変数を設定

`.env.example` をコピーして `.env` にリネームし、以下のように記入する

```env
MISSKEY_INSTANCE=https://your-misskey.example.com
MISSKEY_TOKEN=発行したアクセストークン
TWITTER_AUTH_TOKEN=auth_tokenの値
TWITTER_CT0=ct0の値
TARGET_TWITTER_USERNAME=ミラーしたいXアカウント（@なし）
```

### 4. dataディレクトリを作成

```bash
mkdir data
```

### 5. Dockerでビルド・起動

```bash
docker build -t misskey-x-mirror-bot .
docker run --env-file .env -v $(pwd)/data:/app/data -d --name misskey-x-mirror-bot misskey-x-mirror-bot
```

### ログ確認

```bash
docker logs -f misskey-x-mirror-bot
```

## ⚠️ 注意事項

**Cookieの有効期限について**  
`auth_token` と `ct0` は定期的に失効します。401エラーが出たらDevToolsで再取得して `.env` を更新し、コンテナを再起動してください。

```bash
docker restart misskey-x-mirror-bot
```

**アカウントのBANリスクについて**  
このbotはXの内部APIをCookie認証で叩く非公式な手段を使っています。Xの利用規約に厳密には違反する可能性があるため、**必ず捨てアカウントを使用してください**。本アカウントでの使用は推奨しません。

**クラウド環境について**  
AWS・GCP・AzureなどのクラウドプロバイダのIPはXに既知であり、BANされやすいです。自宅サーバーやVPSでの運用を推奨します。

**リプライについて**  
現状リプライは取得対象外です（`getTweetsAndReplies`が一部環境で動作しないため）。