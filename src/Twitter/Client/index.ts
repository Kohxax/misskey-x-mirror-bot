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

        const cookieStrings = cookies.map((c: any) => {
            const domain = c.domain
                .replace("x.com", "twitter.com")
                .replace(".x.com", ".twitter.com");
            return `${c.name}=${c.value}; Domain=${domain}; Path=${c.path}`;
        });
        await this.scraper.setCookies(cookieStrings);

        const setCookies = await this.scraper.getCookies();
        const cookieNames = setCookies.map((c: any) => c.key ?? c.name);
        const hasAuth = cookieNames.includes("auth_token") && cookieNames.includes("ct0");

        if (!hasAuth) {
            throw new Error("auth_tokenまたはct0がありません");
        }

        console.log("[Twitter] Cookieでログイン済み（auth_token + ct0 確認）");
    }

    async getRecentTweets(username: string, count: number = 20): Promise<Tweet[]> {
        const tweets: Tweet[] = [];
        for await (const tweet of this.scraper.getTweetsAndReplies(username, count)) {
            tweets.push(tweet);
        }
        return tweets;
    }
}
