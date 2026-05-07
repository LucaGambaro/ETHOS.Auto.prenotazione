"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTelegram = sendTelegram;
const config_js_1 = require("./config.js");
async function sendTelegram(message) {
    if (!config_js_1.config.telegramBotToken || !config_js_1.config.telegramChatId) {
        console.warn("[Telegram] BOT_TOKEN o CHAT_ID non configurati — notifica saltata.");
        return;
    }
    try {
        const res = await fetch(`https://api.telegram.org/bot${config_js_1.config.telegramBotToken}/sendMessage`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ chat_id: config_js_1.config.telegramChatId, text: message }),
        });
        if (!res.ok) {
            console.error(`[Telegram] Errore invio: ${res.status} ${await res.text()}`);
        }
    }
    catch (err) {
        console.error("[Telegram] Errore di rete:", err);
    }
}
