import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { config } from "./config.js";

/**
 * Esegue il login con email e password, ottiene un nuovo token,
 * lo aggiorna in memoria (config.timpApiToken) e lo persiste nel file .env.
 * Restituisce il nuovo token.
 */
export async function refreshToken(): Promise<string> {
  if (!config.timpEmail || !config.timpPassword) {
    throw new Error(
      "Credenziali mancanti: imposta TIMP_EMAIL e TIMP_PASSWORD nel file .env per abilitare il re-login automatico.",
    );
  }

  console.log("[Auth] Token scaduto — tentativo di re-login...");

  const res = await fetch(`${config.timpBaseUrl}/sessions`, {
    method: "POST",
    headers: {
      accept: "application/timp.user-app-v2",
      "api-access-key": config.timpApiKey,
      "app-platform": "web",
      "app-version": "8.15.0",
      "content-type": "application/x-www-form-urlencoded",
      "time-zone": "Europe/Rome",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
    },
    body: `email=${encodeURIComponent(config.timpEmail)}&password=${encodeURIComponent(config.timpPassword)}`,
  });

  if (!res.ok) {
    throw new Error(`Login fallito: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const newToken: string =
    data.serial ??
    data.api_access_token ??
    data.access_token ??
    data.token ??
    "";

  if (!newToken) {
    throw new Error(
      `Impossibile estrarre il token dalla risposta di login: ${JSON.stringify(data)}`,
    );
  }

  // Aggiorna il token in memoria
  config.timpApiToken = newToken;

  // Aggiorna TIMP_API_TOKEN nel file .env su disco
  const envPath = resolve(process.cwd(), ".env");
  const envContent = readFileSync(envPath, "utf-8");
  const updated = envContent.replace(
    /^TIMP_API_TOKEN=.*$/m,
    `TIMP_API_TOKEN=${newToken}`,
  );
  writeFileSync(envPath, updated, "utf-8");

  console.log("[Auth] Re-login riuscito. Nuovo token salvato in .env.");
  return newToken;
}
