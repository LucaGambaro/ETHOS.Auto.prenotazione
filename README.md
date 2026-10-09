# timp-auto-prenotazione

Script Node.js (TypeScript) per prenotare automaticamente le sessioni di palestra sulla piattaforma **TIMP**, con notifiche via **Telegram Bot**.

---

## Come funziona

Ogni volta che viene eseguito, lo script:

1. Calcola la **data target** = oggi + 7 giorni (stessa giornata della settimana successiva)
2. Verifica se oggi è domenica → esce senza fare nulla (nessuna sessione)
3. Interroga le API TIMP per ottenere le sessioni disponibili nella data target
4. Prenota la **prima sessione con posti liberi**
5. Verifica il ticket ottenuto
6. Invia una **notifica Telegram** con l'esito (successo, già prenotato, errore, ecc.)

### Orari di apertura prenotazioni

Le prenotazioni si aprono 7 giorni prima della sessione, a orari diversi per giorno:

| Giorno sessione | Apertura prenotazioni |
| --------------- | --------------------- |
| Lunedì          | 08:00                 |
| Martedì         | 13:00                 |
| Mercoledì       | 08:00                 |
| Giovedì         | 13:00                 |
| Venerdì         | 08:00                 |
| Sabato          | 06:00                 |
| Domenica        | — (nessuna sessione)  |

Il crontab va impostato in modo che lo script venga eseguito esattamente a quegli orari.

---

## Struttura del progetto

```
src/
  config.ts       → variabili d'ambiente, targetDate(), bookingSchedule()
  telegram.ts     → helper sendTelegram() per le notifiche
  timp.ts         → chiamate API TIMP (admissions, prenotazione, verifica ticket)
  index.ts        → logica principale: orchestra config → TIMP → Telegram
  check-token.ts  → verifica giornaliera della validità del token TIMP
.env              → credenziali (non committato)
.env.example      → template delle variabili necessarie
```

---

## Prerequisiti

- **Node.js** >= 18 (usa `fetch` nativo)
- **npx** disponibile nel PATH del crontab

---

## Configurazione

### 1. Installa le dipendenze

```bash
npm install
```

### 2. Crea il file `.env`

Copia il template e compila i valori:

```bash
cp .env.example .env
```

```dotenv
# Credenziali TIMP (dalla sessione browser, ispezionando le richieste di rete)
TIMP_API_KEY=sDyGM00j1uF5nwTC
TIMP_API_TOKEN=<il tuo token — si trova nell'header api-access-token>
TIMP_ACTIVITY_ID=131750

# Telegram Bot
TELEGRAM_BOT_TOKEN=<token del bot da @BotFather>
TELEGRAM_CHAT_ID=<il tuo chat ID>
```

### 3. Ottieni il Telegram Chat ID

1. Crea un bot su Telegram parlando con [@BotFather](https://t.me/BotFather) → copia il **Bot Token**
2. Invia un messaggio qualsiasi al tuo bot
3. Apri nel browser: `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
4. Cerca il campo `"id"` dentro `"chat"` → è il tuo **Chat ID**

### 4. Test manuale

```bash
# Prenotazione
npx tsx src/index.ts

# Verifica token
npx tsx src/check-token.ts
```

Dovresti ricevere un messaggio Telegram con l'esito.

---

## Configurazione crontab

Apri l'editor del crontab:

```bash
crontab -e
```

Aggiungi queste 3 righe (sostituisci il percorso assoluto con quello reale del progetto):

```cron
# Lun, Mer, Ven — apertura prenotazioni alle 08:00
0 8 * * 1,3,5 cd /percorso/assoluto/timp-auto-prenotazione && npx tsx src/index.ts >> /tmp/palestra.log 2>&1

# Mar, Gio — apertura prenotazioni alle 13:00
0 13 * * 2,4 cd /percorso/assoluto/timp-auto-prenotazione && npx tsx src/index.ts >> /tmp/palestra.log 2>&1

# Sab — apertura prenotazioni alle 06:00
0 6 * * 6 cd /percorso/assoluto/timp-auto-prenotazione && npx tsx src/index.ts >> /tmp/palestra.log 2>&1

# Check validità token ogni sera alle 17:00
0 17 * * * cd /percorso/assoluto/timp-auto-prenotazione && npx tsx src/check-token.ts >> /tmp/palestra.log 2>&1
```

> **Nota:** verifica che `npx` sia nel PATH del crontab. Se lo script non parte, usa il percorso assoluto:
>
> ```bash
> which npx   # es. /usr/local/bin/npx
> ```

### Verifica i log

```bash
tail -f /tmp/palestra.log
```

---

## Esecuzione con Docker

In alternativa al crontab dell'host, il servizio può girare in un container che:

- esegue gli stessi job con [supercronic](https://github.com/aptible/supercronic) (orari in [docker/crontab](docker/crontab), timezone `Europe/Rome`)
- si riavvia sempre (`restart: unless-stopped`; se scheduler o updater terminano, il container esce e Docker lo riavvia). Un job che fallisce non ferma lo scheduler
- ogni `UPDATE_INTERVAL` secondi (default 300) fa `git fetch` e, se `origin/master` è avanti, `git reset --hard`, `npm ci` (solo se cambia il lock) e `npm run build`

### Setup

1. Crea il file `.env` (vedi sopra): viene montato nel container, così il token rinnovato resta persistente.
2. Crea una **deploy key** read-only e aggiungila su GitHub (repo → Settings → Deploy keys):

   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/timp_deploy -N ""
   ```

3. Avvia:

   ```bash
   docker compose up -d --build
   ```

### Comandi utili

```bash
docker compose logs -f                                # log di scheduler, job e updater
docker compose exec timp node dist/check-token.js     # test manuale
docker compose down                                   # stop
```

Variabili in [docker-compose.yml](docker-compose.yml): `UPDATE_INTERVAL` (secondi), `UPDATE_BRANCH` (default `master`).

> Modifiche a `Dockerfile` o `docker/*.sh` richiedono `docker compose up -d --build`; il codice in `src/` si aggiorna da solo.
>
> Se usi il container, rimuovi le righe del crontab dell'host per evitare doppie prenotazioni.

---

## Notifiche Telegram

Lo script invia un messaggio Telegram in tutti questi casi:

| Situazione | Messaggio |
| ---------- | --------- |

**`src/index.ts` — prenotazione:**

| Situazione                      | Messaggio                                |
| ------------------------------- | ---------------------------------------- |
| ✅ Prenotazione riuscita        | Data, orario sessione, ticket ID e stato |
| ℹ️ Già prenotato                | Avviso con data e orario                 |
| ⚠️ Nessuna sessione disponibile | Avviso con la data cercata               |
| ⚠️ Sessioni al completo         | Avviso con la data                       |
| � Token TIMP scaduto (401)      | Re-login automatico + notifica esito     |
| ❌ Errore generico              | Codice HTTP e dettaglio dell'errore      |

**`src/check-token.ts` — verifica token:**

| Situazione                          | Messaggio                                     |
| ----------------------------------- | --------------------------------------------- |
| ✅ Token valido                     | Conferma che il token è ancora attivo         |
| 🔄 Token scaduto → re-login ok      | Nuovo token salvato in `.env` automaticamente |
| 🔴 Token scaduto → re-login fallito | Credenziali errate o API irraggiungibile      |
| ❌ Errore di rete                   | Dettaglio dell'errore                         |

---

## Gestione del token TIMP

Il `TIMP_API_TOKEN` si rinnova **automaticamente**: quando scade, lo script esegue un re-login con le credenziali in `.env` e salva il nuovo token direttamente nel file `.env`, senza nessun intervento manuale.

Il rinnovo avviene in due occasioni:

- **Sera alle 17:00** — `check-token.ts` verifica il token e, se scaduto, lo rinnova
- **Al momento della prenotazione** — se `index.ts` riceve un 401, rinnova il token e ritenta immediatamente

In entrambi i casi ricevi una notifica Telegram con l'esito.

> **Se il re-login fallisce** (es. password cambiata) ricevi una notifica 🔴. In quel caso aggiorna `TIMP_PASSWORD` nel file `.env`.
