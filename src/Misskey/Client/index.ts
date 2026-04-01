import * as Misskey from "misskey-js";

export class MisskeyClient {
    private client: Misskey.api.APIClient;
    private origin: string;
    private token: string;

    constructor(origin: string, token: string) {
        this.origin = origin;
        this.token = token;
        this.client = new Misskey.api.APIClient({
            origin,
            credential: token,
        });
    }

    async postNote(text: string, fileIds?: string[]) {
        return this.client.request("notes/create", {
            text,
            ...(fileIds && fileIds.length > 0 ? { fileIds } : {}),
        });
    }

    async followUser(userId: string) {
        return this.client.request("following/create", { userId });
    }

    /**
     * URLから画像をDLしてMisskey Driveにアップロード、fileIdを返す
     */
    async uploadFileFromUrl(imageUrl: string): Promise<string | null> {
        const res = await fetch(imageUrl);
        if (!res.ok) throw new Error(`画像取得失敗: ${res.status} ${imageUrl}`);

        const buffer = await res.arrayBuffer();
        const blob = new Blob([buffer]);

        // ファイル名をURLから推測
        const fileName = imageUrl.split("?")[0].split("/").pop() ?? "image.jpg";

        const formData = new FormData();
        formData.append("i", this.token);
        formData.append("force", "true");
        formData.append("file", blob, fileName);

        const uploadRes = await fetch(`${this.origin}/api/drive/files/create`, {
            method: "POST",
            body: formData,
        });

        if (!uploadRes.ok) {
            throw new Error(`Driveアップロード失敗: ${uploadRes.status}`);
        }

        const data = (await uploadRes.json()) as { id: string };
        return data.id;
    }
}