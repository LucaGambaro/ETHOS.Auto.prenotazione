FROM node:22-alpine

ARG TARGETARCH
ARG SUPERCRONIC_VERSION=v0.2.33

RUN apk add --no-cache git openssh-client tini tzdata procps \
 && wget -qO /usr/local/bin/supercronic \
      "https://github.com/aptible/supercronic/releases/download/${SUPERCRONIC_VERSION}/supercronic-linux-${TARGETARCH}" \
 && chmod +x /usr/local/bin/supercronic

ENV TZ=Europe/Rome

WORKDIR /app
COPY . /app
RUN npm ci && npm run build && chmod +x docker/*.sh

ENTRYPOINT ["tini", "--", "/app/docker/entrypoint.sh"]
