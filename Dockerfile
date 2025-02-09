# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --only=production --no-audit --no-optional --verbose

# Copy Next.js and Tailwind CSS configuration files
COPY next.config.mjs ./
COPY tailwind.config.ts ./
COPY postcss.config.mjs ./
COPY tsconfig.json ./
COPY .eslintrc.json ./

# Copy source files and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Only copy necessary files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Create non-root user
RUN adduser -D -u 1001 app
USER app

EXPOSE 3001
CMD ["npm", "run", "start"]