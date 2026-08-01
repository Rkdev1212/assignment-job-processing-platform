# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY package-lock.json ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy all packages and apps
COPY packages ./packages
COPY apps/api ./apps/api

# Install ALL dependencies (including devDependencies needed for build)
RUN npm install

# Generate Prisma client
RUN cd packages/database && npx prisma generate

# Build all packages and the API
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL for Prisma engine compatibility
RUN apk add --no-cache openssl

# Copy node_modules from builder (includes all workspace deps like @nestjs/core)
COPY --from=builder /app/node_modules ./node_modules

# Copy built dist files
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy built package dist files (shared libraries)
COPY --from=builder /app/packages ./packages

# Copy Prisma schema for migrations
COPY packages/database/prisma ./packages/database/prisma

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "apps/api/dist/main.js"]
