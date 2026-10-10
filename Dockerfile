# Immagine base: Node 22 su Alpine (leggera)
FROM node:22-alpine

# Valorizzato automaticamente da Docker (amd64/arm64): serve a scaricare il binario supercronic giusto
ARG TARGETARCH
ARG SUPERCRONIC_VERSION=v0.2.33

# Pacchetti di sistema:
# - git + openssh-client: usati da docker/update.sh per fare fetch del codice da GitHub
# - tini: init process (PID 1), inoltra i segnali e ripulisce i processi zombie
# - tzdata: database dei fusi orari, necessario perché TZ=Europe/Rome abbia effetto
# - procps: fornisce pgrep/pkill (healthcheck del compose e reload del crontab in update.sh)
# Poi scarica supercronic, lo scheduler cron pensato per i container (sostituisce crond)
RUN apk add --no-cache git openssh-client tini tzdata procps \
 && wget -qO /usr/local/bin/supercronic \
      "https://github.com/aptible/supercronic/releases/download/${SUPERCRONIC_VERSION}/supercronic-linux-${TARGETARCH}" \
 && chmod +x /usr/local/bin/supercronic

# Fuso orario del container: gli orari del crontab sono interpretati in ora italiana
ENV TZ=Europe/Rome

WORKDIR /app
# Copia tutto il repo (inclusa .git, che serve all'updater; vedi .dockerignore per cosa viene escluso)
COPY . /app
# Installa le dipendenze, compila src/ in dist/ e rende eseguibili gli script in docker/
RUN npm ci && npm run build && chmod +x docker/*.sh

# Avvio: tini (PID 1) -> entrypoint.sh, che lancia updater e scheduler
ENTRYPOINT ["tini", "--", "/app/docker/entrypoint.sh"]
