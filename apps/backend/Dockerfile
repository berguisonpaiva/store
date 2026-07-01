FROM oven/bun:1 AS app
WORKDIR /repo

COPY . .
RUN bun install --frozen-lockfile || bun install
RUN bun --cwd apps/backend run build

ENV NODE_ENV=production
EXPOSE 4000
CMD ["bun","--cwd","apps/backend","run","start:prod"]
