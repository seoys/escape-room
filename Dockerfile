# syntax=docker/dockerfile:1

FROM node:22-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@10.20.0

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV BUILD_STANDALONE=true
# NEXT_PUBLIC_* values are baked in at build time. The tracked .env file supplies the
# default, so an empty build arg must not override it.
RUN if [ -z "$NEXT_PUBLIC_API_URL" ]; then unset NEXT_PUBLIC_API_URL; fi; pnpm build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=10050 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# File modes in the build context are not guaranteed (the server walks all of public/
# at startup), so make everything readable and hand the writable parts (.next, e.g. the
# image optimization cache) to the runtime user.
RUN mkdir -p .next/cache \
    && chmod -R a+rX /app \
    && chown -R node:node /app/.next /app/public
USER node
EXPOSE 10050
CMD ["node", "server.js"]
