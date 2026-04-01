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
        try {
            const raw = await fs.readFile(COOKIES_PATH, "utf-8");
            const cookies = JSON.parse(raw);

            // Cookie-Editor形式の場合、name=value形式の文字列配列に変換
            const cookieStrings = cookies.map(
                (c: any) => `${c.name}=${c.value}; Domain=${c.domain}; Path=${c.path}`
            );
            await this.scraper.setCookies(cookieStrings);

            if (await this.scraper.isLoggedIn()) {
                console.log("[Twitter] Cookieでログイン済み");
                return;
            }
        } catch {
            // Cookieファイルなし or 無効 → ログインへ
        }

        console.log("[Twitter] ログイン中...");
        await this.scraper.login(this.username, this.password, this.email);

        // Cookieをキャッシュ
        const cookies = await this.scraper.getCookies();
        await fs.mkdir(path.dirname(COOKIES_PATH), { recursive: true });
        await fs.writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2));
        console.log("[Twitter] ログイン完了・Cookie保存");
    }

    async getRecentTweets(username: string, count: number = 20): Promise<Tweet[]> {
        const tweets: Tweet[] = [];
        for await (const tweet of this.scraper.getTweetsAndReplies(username, count)) {
            tweets.push(tweet);
        }
        return tweets;
    }
}
