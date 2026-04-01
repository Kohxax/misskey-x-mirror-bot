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

        const cookieStrings = cookies.map(
            (c: any) => {
                const domain = c.domain.replace("x.com", "twitter.com").replace(".x.com", ".twitter.com");
                return `${c.name}=${c.value}; Domain=${domain}; Path=${c.path}`;
            }
        );
        await this.scraper.setCookies(cookieStrings);

        const loggedIn = await this.scraper.isLoggedIn();
        console.log("[Twitter] isLoggedIn:", loggedIn);

        if (!loggedIn) {
            throw new Error("Cookie認証失敗。Cookieを再エクスポートしてください。");
        }

        console.log("[Twitter] Cookieでログイン済み");
    }

    async getRecentTweets(username: string, count: number = 20): Promise<Tweet[]> {
        const tweets: Tweet[] = [];
        for await (const tweet of this.scraper.getTweetsAndReplies(username, count)) {
            tweets.push(tweet);
        }
        return tweets;
    }
}
