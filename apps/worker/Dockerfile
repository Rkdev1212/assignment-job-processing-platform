# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY package-lock.json ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy all packages and worker app
COPY packages ./packages
COPY apps/worker ./apps/worker

# Install ALL dependencies (including devDependencies needed for build)
RUN npm install

# Generate Prisma client
RUN cd packages/database && npx prisma generate

# Build all packages and the worker
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules from builder (includes all workspace deps)
COPY --from=builder /app/node_modules ./node_modules

# Copy built dist files
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist

# Copy built package dist files (shared libraries)
COPY --from=builder /app/packages ./packages

# Run worker
CMD ["node", "apps/worker/dist/main.js"]
