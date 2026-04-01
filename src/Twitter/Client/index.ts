import { Scraper, Tweet } from "@the-convocation/twitter-scraper";
import fs from "fs/promises";
import path from "path";

const COOKIES_PATH = path.resolve("data/twitter-cookies.json");

export class TwitterClient {
    private scraper: Scraper;

    constructor() {
        this.scraper = new Scraper();
    }

    async init(): Promise<void> {
        const authToken = process.env.TWITTER_AUTH_TOKEN;
        const ct0 = process.env.TWITTER_CT0;

        if (!authToken || !ct0) {
            throw new Error("TWITTER_AUTH_TOKEN / TWITTER_CT0 が未設定です");
        }

        await this.scraper.setCookies([
            `auth_token=${authToken}; Domain=.x.com; Path=/`,
            `ct0=${ct0}; Domain=.x.com; Path=/`,
        ]);

        console.log("[Twitter] Cookieセット完了");
    }

    async getRecentTweets(username: string, count: number = 20): Promise<Tweet[]> {
        const tweets: Tweet[] = [];
        for await (const tweet of this.scraper.getTweetsAndReplies(username, count)) {
            tweets.push(tweet);
        }
        return tweets;
    }
}