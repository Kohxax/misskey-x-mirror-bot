import { Scraper, Tweet } from "agent-twitter-client";
import fs from "fs/promises";
import path from "path";

const COOKIES_PATH = path.resolve("data/twitter-cookies.json");

export class TwitterClient {
    private scraper: Scraper;
    private username: string;
    private password: string;
    private email: string;

    constructor(username: string, password: string, email: string) {
        this.scraper = new Scraper();
        this.username = username;
        this.password = password;
        this.email = email;
    }

    async init(): Promise<void> {
        const raw = await fs.readFile(COOKIES_PATH, "utf-8");
        const cookies = JSON.parse(raw);

        // auth_tokenとct0だけ抽出して渡す
        const authToken = cookies.find((c: any) => c.name === "auth_token")?.value;
        const ct0 = cookies.find((c: any) => c.name === "ct0")?.value;
        const twid = cookies.find((c: any) => c.name === "twid")?.value;

        if (!authToken || !ct0) {
            throw new Error("auth_tokenまたはct0が見つかりません");
        }

        const cookieStrings = [
            `auth_token=${authToken}; Domain=.twitter.com; Path=/`,
            `ct0=${ct0}; Domain=.twitter.com; Path=/`,
            ...(twid ? [`twid=${twid}; Domain=.twitter.com; Path=/`] : []),
        ];

        await this.scraper.setCookies(cookieStrings);
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
