import cron from "node-cron";
import { Tweet } from "@the-convocation/twitter-scraper";
import { TwitterClient } from "../Twitter/Client/index.js";
import { MisskeyClient } from "../Misskey/Client/index.js";
import { Notifier } from "../Notifier/index.js";
import { getLastTweetId, setLastTweetId } from "./store.js";

export class Mirror {
    private twitter: TwitterClient;
    private misskey: MisskeyClient;
    private targetUsername: string;
    private notifier: Notifier;

    constructor(
        twitter: TwitterClient,
        misskey: MisskeyClient,
        targetUsername: string,
        notifier: Notifier
    ) {
        this.twitter = twitter;
        this.misskey = misskey;
        this.targetUsername = targetUsername;
        this.notifier = notifier;
    }

    async run(): Promise<void> {
        console.log(`[Mirror] @${this.targetUsername} をチェック中...`);
        const lastId = await getLastTweetId();

        let tweets: Tweet[];
        try {
            tweets = await this.twitter.getRecentTweets(this.targetUsername, 20);
        } catch (err: any) {
            if (err?.response?.status === 401) {
                await this.notifier.notify(
                    "⚠️ **misskey-x-mirror-bot**\nXのCookieが失効しました。`auth_token`と`ct0`を再取得して`.env`を更新してください。"
                );
            } else {
                console.error("[Mirror] ツイート取得失敗:", err);
            }
            return;
        }

        const sorted = tweets
            .filter((t): t is Tweet & { id: string } => !!t.id)
            .sort((a, b) => compareTweetId(a.id, b.id));

        const newTweets = lastId
            ? sorted.filter((t) => compareTweetId(t.id, lastId) > 0)
            : sorted.slice(-1);

        if (newTweets.length === 0) {
            console.log("[Mirror] 新着なし");
            return;
        }

        for (const tweet of newTweets) {
            await this.postTweet(tweet);
            await setLastTweetId(tweet.id);
            await sleep(2000);
        }

        console.log(`[Mirror] ${newTweets.length}件投稿完了`);
    }

    private async postTweet(tweet: Tweet): Promise<void> {
        const text = buildNoteText(tweet, this.targetUsername);
        const fileIds: string[] = [];

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

    start(cronExpr: string = "*/5 * * * *"): void {
        this.run().catch(console.error);
        cron.schedule(cronExpr, () => {
            this.run().catch(console.error);
        });
        console.log(`[Mirror] スケジュール開始: ${cronExpr}`);
    }
}

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
