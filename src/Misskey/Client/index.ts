import * as Misskey from "misskey-js";

export class MisskeyClient {

    private client: Misskey.api.APIClient;

    constructor(origin: string, token: string) {
        this.client = new Misskey.api.APIClient({
            origin,
            credential: token,
        });
    }

    async postNote(text: string) {
        return this.client.request('notes/create', { text });
    }

    async followUser(userId: string) {
        return this.client.request('following/create', { userId });
    }
}
