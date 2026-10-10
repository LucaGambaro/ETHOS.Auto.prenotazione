#!/bin/sh
# Aggiorna periodicamente il codice da git. Non esce mai: ogni errore viene loggato e si riprova al giro successivo.

# Configurabili dal docker-compose.yml (environment); default: 5 minuti, branch master
INTERVAL="${UPDATE_INTERVAL:-300}"
BRANCH="${UPDATE_BRANCH:-master}"

cd /app || exit 1

log() {
  echo "[update] $(date '+%Y-%m-%d %H:%M:%S') $*"
}

update() {
  # Scarica i nuovi commit via SSH (usa la deploy key montata dal compose)
  git fetch origin "$BRANCH" || { log "fetch fallito"; return; }

  # Se il commit locale coincide con quello remoto non c'è nulla da fare
  local_rev="$(git rev-parse HEAD)"
  remote_rev="$(git rev-parse "origin/$BRANCH")"
  [ "$local_rev" = "$remote_rev" ] && return

  log "nuova versione ${local_rev%"${local_rev#???????}"} -> ${remote_rev%"${remote_rev#???????}"}"

  # Confronta l'hash di package-lock.json prima/dopo il reset per sapere se le dipendenze sono cambiate
  lock_before="$(git rev-parse HEAD:package-lock.json 2>/dev/null)"
  git reset --hard "origin/$BRANCH" || { log "reset fallito"; return; }
  lock_after="$(git rev-parse HEAD:package-lock.json 2>/dev/null)"

  if [ "$lock_before" != "$lock_after" ]; then
    log "dipendenze cambiate: npm ci"
    npm ci || { log "npm ci fallito"; return; }
  fi

  # dist/ è committato, ma si ricompila comunque per sicurezza
  npm run build || { log "build fallita"; return; }

  # Ricarica il crontab (potrebbe essere cambiato): SIGUSR2 fa rileggere il file a supercronic senza riavviarlo
  pkill -USR2 supercronic
  log "aggiornamento completato"
}

# Loop infinito: controlla, poi dorme INTERVAL secondi
while true; do
  update
  sleep "$INTERVAL"
done
