import cron from "node-cron";
import { Tweet } from "@the-convocation/twitter-scraper";
import { TwitterClient } from "../Twitter/Client/index.js";
import { MisskeyClient } from "../Misskey/Client/index.js";
import { getLastTweetId, setLastTweetId } from "./store.js";

export class Mirror {
    private twitter: TwitterClient;
    private misskey: MisskeyClient;
    private targetUsername: string;

    constructor(
        twitter: TwitterClient,
        misskey: MisskeyClient,
        targetUsername: string
    ) {
        this.twitter = twitter;
        this.misskey = misskey;
        this.targetUsername = targetUsername;
    }

    /**
     * 新着ツイートを取得してMisskeyへ投稿
     */
    async run(): Promise<void> {
        console.log(`[Mirror] @${this.targetUsername} をチェック中...`);
        const lastId = await getLastTweetId();

        const tweets = await this.twitter.getRecentTweets(this.targetUsername, 20);

        // 古い順に並べ替え（APIは新しい順で返ってくる）
        const sorted = tweets
            .filter((t): t is Tweet & { id: string } => !!t.id)
            .sort((a, b) => compareTweetId(a.id, b.id));

        // lastIdより新しいものだけ抽出
        const newTweets = lastId
            ? sorted.filter((t) => compareTweetId(t.id, lastId) > 0)
            : sorted.slice(-1); // 初回は最新1件だけ投稿

        if (newTweets.length === 0) {
            console.log("[Mirror] 新着なし");
            return;
        }

        for (const tweet of newTweets) {
            await this.postTweet(tweet);
            await setLastTweetId(tweet.id);
            // 連続投稿を少し間隔を空ける
            await sleep(2000);
        }

        console.log(`[Mirror] ${newTweets.length}件投稿完了`);
    }

    private async postTweet(tweet: Tweet): Promise<void> {
        const text = buildNoteText(tweet, this.targetUsername);
        const fileIds: string[] = [];

        // 画像添付
        if (tweet.photos && tweet.photos.length > 0) {
            for (const photo of tweet.photos.slice(0, 4)) {
                const url = photo.url;
                if (!url) continue;
                try {
                    const fileId = await this.misskey.uploadFileFromUrl(url);
                    if (fileId) fileIds.push(fileId);
                } catch (err) {
                    console.error(`[Mirror] 画像アップロード失敗: ${url}`, err);
                }
            }
        }

        try {
            await this.misskey.postNote(text, fileIds.length > 0 ? fileIds : undefined);
            console.log(`[Mirror] 投稿: ${tweet.id}`);
        } catch (err) {
            console.error(`[Mirror] Misskey投稿失敗: ${tweet.id}`, err);
        }
    }

    /**
     * cronで定期実行（デフォルト5分ごと）
     */
    start(cronExpr: string = "*/5 * * * *"): void {
        // 起動時に1回実行
        this.run().catch(console.error);
        cron.schedule(cronExpr, () => {
            this.run().catch(console.error);
        });
        console.log(`[Mirror] スケジュール開始: ${cronExpr}`);
    }
}

/**
 * ツイートIDは数値文字列（Snowflake）なので文字列長 → 辞書順で比較可能
 */
function compareTweetId(a: string, b: string): number {
    if (a.length !== b.length) return a.length - b.length;
    return a < b ? -1 : a > b ? 1 : 0;
}

function buildNoteText(tweet: Tweet, username: string): string {
    const body = tweet.text ?? "";
    const tweetUrl = `https://twitter.com/${username}/status/${tweet.id}`;
    const prefix = tweet.isReply ? `💬 リプライ\n` : "";
    return `${prefix}${body}\n\n🔗 ${tweetUrl}`;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
