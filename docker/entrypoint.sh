#!/bin/sh
# Avvia scheduler e updater; se uno dei due termina esce con errore così Docker riavvia il container.
# Chiamato da tini (PID 1) come da ENTRYPOINT del Dockerfile.

# Updater in background: ogni UPDATE_INTERVAL secondi aggiorna il codice da git (vedi update.sh)
/app/docker/update.sh &
# Dashboard web in background: gestione giorni e storico (porta DASHBOARD_PORT, vedi docker-compose.yml)
cd /app && node dist/dashboard/main.js &
# Scheduler in background: esegue i job definiti in docker/crontab
supercronic /app/docker/crontab &

# Resta in attesa finché uno qualsiasi dei processi in background termina
wait -n
echo "[entrypoint] un processo è terminato, esco per consentire il riavvio"
# Exit code != 0 => la policy restart: unless-stopped del compose riavvia il container
exit 1
