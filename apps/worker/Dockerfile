# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy all packages and worker app
COPY packages ./packages
COPY apps/worker ./apps/worker

# Install dependencies
RUN npm install

# Generate Prisma client
RUN cd packages/database && npx prisma generate

# Build all packages and the worker
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/packages/database/node_modules/.prisma ./packages/database/node_modules/.prisma
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/packages ./packages

# Run worker
CMD ["node", "apps/worker/dist/main.js"]
