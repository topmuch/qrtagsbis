FROM node:20-alpine

# Install required packages
RUN apk add --no-cache git libc6-compat sqlite
RUN npm install -g bun

WORKDIR /app

# Clone the repository
RUN git clone https://github.com/topmuch/qrtagssen.git .

# Install dependencies
RUN bun install

# Generate Prisma Client
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/qrtags.db
RUN bun run build

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrtags.db

# Start command: init DB, create admin user, then start server
CMD sh -c "\
  mkdir -p /app/data && \
  export DATABASE_URL=file:/app/data/qrtags.db && \
  echo '[startup] Running database migrations...' && \
  npx prisma db push --skip-generate && \
  echo '[startup] Creating admin user...' && \
  node scripts/create-admin.cjs && \
  echo '[startup] Starting QRTags server...' && \
  exec node .next/standalone/server.js \
"
