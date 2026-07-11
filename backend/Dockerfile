# ---- deps stage: install only production dependencies ----
FROM node:20.17-alpine3.20 AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

# ---- runtime stage ----
FROM node:20.17-alpine3.20 AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Install curl only for the HEALTHCHECK, then drop apk cache
RUN apk add --no-cache curl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run as the built-in non-root "node" user, not root
USER node

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
