import fs from "fs/promises";
import path from "path";

const STORE_PATH = path.resolve("data/store.json");

interface Store {
    lastTweetId: string | null;
}

async function readStore(): Promise<Store> {
    try {
        const raw = await fs.readFile(STORE_PATH, "utf-8");
        return JSON.parse(raw) as Store;
    } catch {
        return { lastTweetId: null };
    }
}

async function writeStore(store: Store): Promise<void> {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

export async function getLastTweetId(): Promise<string | null> {
    const store = await readStore();
    return store.lastTweetId;
}

export async function setLastTweetId(id: string): Promise<void> {
    await writeStore({ lastTweetId: id });
}
