import dotenv from "dotenv";
import * as Misskey from "misskey-js";
import { MisskeyClient } from "./Misskey/Client/index.js";
import { Followback } from "./Misskey/Follow/index.js";
import { TwitterClient } from "./Twitter/Client/index.js";
import { Mirror } from "./Mirror/index.js";

dotenv.config();

const origin = process.env.MISSKEY_INSTANCE;
const token = process.env.MISSKEY_TOKEN;
const twitterUsername = process.env.TWITTER_USERNAME;
const twitterPassword = process.env.TWITTER_PASSWORD;
const twitterEmail = process.env.TWITTER_EMAIL;
const targetUsername = process.env.TARGET_TWITTER_USERNAME;

if (!origin || !token) {
    throw new Error("MISSKEY_INSTANCEとMISSKEY_TOKENが.envに設定されていません");
}

if (!targetUsername) {
    throw new Error("TARGET_TWITTER_USERNAMEが未設定です");
}

const misskeyClient = new MisskeyClient(origin, token);
const stream = new Misskey.Stream(origin, { token });
const followback = new Followback(misskeyClient, stream);
followback.start();

const twitterClient = new TwitterClient();

// Twitter Cookieログインを初期化してからMirror開始
twitterClient.init().then(() => {
    const mirror = new Mirror(twitterClient, misskeyClient, targetUsername);
    mirror.start("*/5 * * * *");
}).catch((err) => {
    console.error("[起動失敗] Twitterログインエラー:", err);
    process.exit(1);
});
