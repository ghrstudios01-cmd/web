FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install all deps (including dev) to build the app
RUN npm ci --no-audit --no-fund --legacy-peer-deps

# Copy project sources and build
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built app and package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Install only production deps
RUN npm ci --only=production --no-audit --no-fund || true

EXPOSE 5000
CMD ["node", "dist/index.cjs"]
