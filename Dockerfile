# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Native Build-Tools für better-sqlite3
RUN apk add --no-cache python3 make g++

# NEXT_PUBLIC_* Variablen müssen zur Build-Zeit verfügbar sein
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_AZURE_AD_CLIENT_ID
ARG NEXT_PUBLIC_AZURE_AD_TENANT_ID
ARG NEXT_PUBLIC_DEV_MODE=false

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_AZURE_AD_CLIENT_ID=$NEXT_PUBLIC_AZURE_AD_CLIENT_ID
ENV NEXT_PUBLIC_AZURE_AD_TENANT_ID=$NEXT_PUBLIC_AZURE_AD_TENANT_ID
ENV NEXT_PUBLIC_DEV_MODE=$NEXT_PUBLIC_DEV_MODE

# Dependencies installieren
COPY package*.json ./
COPY turbo.json ./
COPY packages ./packages
COPY apps/admin/package*.json ./apps/admin/
COPY apps/outlook-addin/package*.json ./apps/outlook-addin/

RUN npm ci

# Source kopieren
COPY apps/admin ./apps/admin
COPY apps/outlook-addin ./apps/outlook-addin

# Admin bauen
RUN npm run build --workspace=apps/admin

# Outlook Add-In bauen und nach public/addin/ kopieren
RUN npm run build --workspace=apps/outlook-addin
RUN mkdir -p ./apps/admin/public/addin
RUN cp -r ./apps/outlook-addin/dist/* ./apps/admin/public/addin/

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# node_modules aus Builder kopieren (enthält bereits gebautes better-sqlite3)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/admin/package*.json ./apps/admin/
COPY --from=builder /app/apps/admin/.next ./apps/admin/.next
COPY --from=builder /app/apps/admin/public ./apps/admin/public
COPY --from=builder /app/apps/admin/next.config.js ./apps/admin/
COPY --from=builder /app/package.json ./

# Data Verzeichnisse
RUN mkdir -p /data /app/uploads

# Non-root User
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /data /app/uploads
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

WORKDIR /app/apps/admin

CMD ["npm", "start"]
