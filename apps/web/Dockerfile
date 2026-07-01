FROM oven/bun:1 AS app
WORKDIR /repo

COPY . .
RUN bun install --frozen-lockfile || bun install
RUN bun --cwd apps/web run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun","--cwd","apps/web","run","start"]
