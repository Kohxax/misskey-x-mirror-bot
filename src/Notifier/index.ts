export class Notifier {
    private webhookUrl: string | null;

    constructor(webhookUrl: string | null) {
        this.webhookUrl = webhookUrl;
    }

    async notify(message: string): Promise<void> {
        if (!this.webhookUrl) {
            console.error("[Notifier] DISCORD_WEBHOOK_URLが未設定のためコンソールのみ:", message);
            return;
        }
        try {
            await fetch(this.webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: message }),
            });
        } catch (err) {
            console.error("[Notifier] Discord通知失敗:", err);
        }
    }
}
