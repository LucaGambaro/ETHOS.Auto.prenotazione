import { config } from "./config.js";

export async function sendTelegram(message: string): Promise<void> {
  if (!config.telegramBotToken || !config.telegramChatId) {
    console.warn(
      "[Telegram] BOT_TOKEN o CHAT_ID non configurati — notifica saltata.",
    );
    return;
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: config.telegramChatId, text: message }),
      },
    );
    if (!res.ok) {
      console.error(
        `[Telegram] Errore invio: ${res.status} ${await res.text()}`,
      );
    }
  } catch (err) {
    console.error("[Telegram] Errore di rete:", err);
  }
}
