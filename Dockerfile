FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY web/package.json web/package.json
COPY prisma prisma

RUN npm ci

COPY . .
RUN npm run build && chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/acme.db
ENV PORT=3000

VOLUME /data
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
