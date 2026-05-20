# Multi-stage Dockerfile optimized for Agnisfamily production deployment
# Stage 1: Build and compile stage
FROM node:20-slim AS builder

# Install build dependencies for compiling native node bindings (better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install dependencies (including devDependencies needed for compiling)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Compile application (Vite production bundle + esbuild Node production bundle)
RUN npm run build

# Prune devDependencies to keep image context small
RUN npm prune --production


# Stage 2: Lightweight runtime stage
FROM node:20-slim AS runner

# Set production context
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/family.db

WORKDIR /app

# Create clean persistent directories for SQLite databases and user uploads
RUN mkdir -p /app/data /app/uploads

# Copy compiled files and production node_modules from build stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# User gallery uploads can be mounted to /app/uploads
# SQLite database file can be backed up or mounted to /app/data
VOLUME ["/app/data", "/app/uploads"]

EXPOSE 3000

# Start the Node.js production server
CMD ["node", "dist/server.cjs"]
