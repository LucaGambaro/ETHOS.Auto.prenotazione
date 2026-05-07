"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_js_1 = require("./auth.js");
const config_js_1 = require("./config.js");
const telegram_js_1 = require("./telegram.js");
async function checkToken() {
    const timestamp = new Date().toLocaleString("it-IT", {
        timeZone: "Europe/Rome",
    });
    console.log(`[${timestamp}] Verifica validità token TIMP...`);
    let ok;
    let detail = "";
    try {
        const res = await fetch(`${config_js_1.config.timpBaseUrl}/users/profile_feed`, {
            headers: {
                accept: "application/timp.user-app-v2",
                "api-access-key": config_js_1.config.timpApiKey,
                "api-access-token": config_js_1.config.timpApiToken,
                "app-platform": "web",
                "app-version": "8.15.0",
                "content-type": "application/json",
                "time-zone": "Europe/Rome",
            },
        });
        if (res.status === 401) {
            ok = false;
            detail = "risposta 401 Unauthorized";
        }
        else if (res.ok || res.status === 304) {
            ok = true;
        }
        else {
            ok = false;
            detail = `risposta inattesa: ${res.status}`;
        }
    }
    catch (err) {
        ok = false;
        detail = `errore di rete: ${err instanceof Error ? err.message : String(err)}`;
    }
    if (ok) {
        const msg = "✅ Token TIMP valido";
        console.log(msg);
        await (0, telegram_js_1.sendTelegram)(msg);
        return;
    }
    // Token non valido: tenta il re-login automatico
    console.log(`[Token] Non valido (${detail}) — avvio re-login automatico...`);
    try {
        await (0, auth_js_1.refreshToken)();
        const msg = `🔄 Token TIMP rinnovato automaticamente (era scaduto: ${detail})`;
        console.log(msg);
        await (0, telegram_js_1.sendTelegram)(msg);
    }
    catch (loginErr) {
        const msg = `🔴 Token TIMP scaduto e re-login fallito: ${loginErr instanceof Error ? loginErr.message : String(loginErr)}`;
        console.error(msg);
        await (0, telegram_js_1.sendTelegram)(msg);
    }
}
checkToken().catch(async (err) => {
    const msg = `❌ Errore inatteso nel check token: ${err instanceof Error ? err.message : String(err)}`;
    console.error(msg);
    await (0, telegram_js_1.sendTelegram)(msg).catch(() => { });
    process.exit(1);
});
