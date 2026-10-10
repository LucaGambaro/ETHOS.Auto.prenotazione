#!/bin/sh
# Avvia scheduler e updater; se uno dei due termina esce con errore così Docker riavvia il container.
# Chiamato da tini (PID 1) come da ENTRYPOINT del Dockerfile.

# Updater in background: ogni UPDATE_INTERVAL secondi aggiorna il codice da git (vedi update.sh)
/app/docker/update.sh &
# Scheduler in background: esegue i job definiti in docker/crontab
supercronic /app/docker/crontab &

# Resta in attesa finché uno qualsiasi dei due processi in background termina
wait -n
echo "[entrypoint] un processo è terminato, esco per consentire il riavvio"
# Exit code != 0 => la policy restart: unless-stopped del compose riavvia il container
exit 1
