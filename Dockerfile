FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN chmod +x /app/docker/entrypoint.sh
ENV DATABASE_URL=file:/tmp/build.db
RUN npm run db:push -- --skip-generate
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
