# Build stage
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Copy package files for production
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Create and set up the user
RUN adduser -D -u 1001 app
USER app

EXPOSE 3001
CMD ["npm", "run", "start"]