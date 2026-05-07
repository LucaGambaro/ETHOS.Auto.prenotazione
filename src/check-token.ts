import { config, targetDate } from "./config.js";
import { sendTelegram } from "./telegram.js";

async function checkToken(): Promise<void> {
  const timestamp = new Date().toLocaleString("it-IT", {
    timeZone: "Europe/Rome",
  });
  console.log(`[${timestamp}] Verifica validità token TIMP...`);

  let ok: boolean;
  let detail = "";

  try {
    const res = await fetch(
      `${config.timpBaseUrl}/activities/${config.timpActivityId}/admissions?date=${targetDate()}`,
      {
        headers: {
          accept: "application/timp.user-app-v2",
          "api-access-key": config.timpApiKey,
          "api-access-token": config.timpApiToken,
          "app-platform": "web",
          "app-version": "8.15.0",
          "content-type": "application/json",
          "time-zone": "Europe/Rome",
        },
      },
    );

    if (res.status === 401) {
      ok = false;
      detail = "risposta 401 Unauthorized";
    } else if (res.ok || res.status === 304) {
      ok = true;
    } else {
      ok = false;
      detail = `risposta inattesa: ${res.status}`;
    }
  } catch (err) {
    ok = false;
    detail = `errore di rete: ${err instanceof Error ? err.message : String(err)}`;
  }

  const msg = ok
    ? "✅ Token TIMP valido"
    : `🔴 Token TIMP non valido (${detail})\nAggiorna TIMP_API_TOKEN nel file .env`;

  console.log(msg);
  await sendTelegram(msg);
}

checkToken().catch(async (err) => {
  const msg = `❌ Errore inatteso nel check token: ${err instanceof Error ? err.message : String(err)}`;
  console.error(msg);
  await sendTelegram(msg).catch(() => {});
  process.exit(1);
});
