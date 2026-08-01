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

# Install dependencies
RUN npm install

# Generate Prisma client
RUN cd packages/database && npx prisma generate

# Build all packages and the API
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./
COPY package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/packages/database/node_modules/.prisma ./packages/database/node_modules/.prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages ./packages

# Copy Prisma schema for migrations
COPY packages/database/prisma ./packages/database/prisma

# Expose port
EXPOSE 3000

# Run migrations and start server
CMD ["sh", "-c", "cd packages/database && npx prisma migrate deploy && cd ../.. && node apps/api/dist/main.js"]
