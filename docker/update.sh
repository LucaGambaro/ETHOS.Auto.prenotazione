#!/bin/sh
# Aggiorna periodicamente il codice da git. Non esce mai: ogni errore viene loggato e si riprova al giro successivo.

INTERVAL="${UPDATE_INTERVAL:-300}"
BRANCH="${UPDATE_BRANCH:-master}"

cd /app || exit 1

log() {
  echo "[update] $(date '+%Y-%m-%d %H:%M:%S') $*"
}

update() {
  git fetch origin "$BRANCH" || { log "fetch fallito"; return; }

  local_rev="$(git rev-parse HEAD)"
  remote_rev="$(git rev-parse "origin/$BRANCH")"
  [ "$local_rev" = "$remote_rev" ] && return

  log "nuova versione ${local_rev%"${local_rev#???????}"} -> ${remote_rev%"${remote_rev#???????}"}"

  lock_before="$(git rev-parse HEAD:package-lock.json 2>/dev/null)"
  git reset --hard "origin/$BRANCH" || { log "reset fallito"; return; }
  lock_after="$(git rev-parse HEAD:package-lock.json 2>/dev/null)"

  if [ "$lock_before" != "$lock_after" ]; then
    log "dipendenze cambiate: npm ci"
    npm ci || { log "npm ci fallito"; return; }
  fi

  npm run build || { log "build fallita"; return; }

  # Ricarica il crontab (potrebbe essere cambiato)
  pkill -USR2 supercronic
  log "aggiornamento completato"
}

while true; do
  update
  sleep "$INTERVAL"
done
