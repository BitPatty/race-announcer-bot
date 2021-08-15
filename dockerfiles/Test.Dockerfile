ARG BASE_IMAGE
ARG DISCORD_BOT_TOKEN

FROM ${BASE_IMAGE} as base

ARG DISCORD_BOT_TOKEN

ENV NODE_ENV=test
ENV DISCORD_BOT_TOKEN=${DISCORD_BOT_TOKEN}

# Install build dependencies
RUN apk --no-cache add \
  bash \
  mariadb \
  mariadb-common \
  mariadb-client \
  redis

# Make sure we have the latest npm version
RUN npm install -g npm@latest

WORKDIR /app

# Run the tests
RUN chmod +x scripts/run-tests.sh
RUN ./scripts/run-tests.sh $PWD

