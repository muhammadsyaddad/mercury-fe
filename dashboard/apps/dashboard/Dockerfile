FROM oven/bun:1 AS base

# Prune
FROM base AS pruner
WORKDIR /app
COPY . .
RUN bunx turbo prune --scope=@vision_dashboard/dashboard --docker

# Installer
FROM base AS installer
WORKDIR /app

# Add lockfile and package.json's of isolated subworkspace
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock

RUN bun install --frozen-lockfile

# Build the project
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

# Build
# Environment variables must be present at build time if they are used in client-side code
# ENV NEXT_PUBLIC_API_URL=... 
RUN bun run build:dashboard

# Runner
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Don't run as root
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs nextjs
USER nextjs

COPY --from=installer /app/apps/dashboard/public ./apps/dashboard/public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./apps/dashboard/.next/static

# Expose the port the app runs on
EXPOSE 3000

ENV PORT=3000

CMD ["bun", "apps/dashboard/server.js"]
