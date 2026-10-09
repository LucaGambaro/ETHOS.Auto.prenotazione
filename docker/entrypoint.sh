#!/bin/sh
# Avvia scheduler e updater; se uno dei due termina esce con errore così Docker riavvia il container.

/app/docker/update.sh &
supercronic /app/docker/crontab &

wait -n
echo "[entrypoint] un processo è terminato, esco per consentire il riavvio"
exit 1
