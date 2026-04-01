import { MisskeyClient } from "../Client/index.js";
import * as Misskey from "misskey-js";

export class Followback {
    private misskey: MisskeyClient;
    private stream: Misskey.Stream;

    constructor(misskey: MisskeyClient, stream: Misskey.Stream) {
        this.misskey = misskey;
        this.stream = stream;
    }

    start() {
        const mainChannel = this.stream.useChannel('main');
        mainChannel.on('followed', this.handleFollowed.bind(this));
        console.log('Followback started');
    }

    private async handleFollowed(user: Misskey.entities.User) {
        try {
            await this.misskey.followUser(user.id);
            console.log('フォローバックしました。');
        } catch (err: any) {
            if (err.code === 'ALREADY_FOLLOWING') {
                console.log('既にフォロー済みです。');
            } else {
                console.error('フォローバックに失敗しました:', err);
            }
        }
    }
}
