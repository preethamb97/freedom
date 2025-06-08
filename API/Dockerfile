# Development stage with hot reloading
FROM oven/bun:1 as development

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN bun install

# Create logs directory
RUN mkdir -p logs

# Set environment variables for development
ENV NODE_ENV=development

# Expose port
EXPOSE 3001

# Start with hot reloading (bun will watch for changes)
CMD ["bun", "--watch", "run", "src/server.js"]

# Production stage
FROM oven/bun:1 as production

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN bun install --production

# Copy source code
COPY src/ ./src/

# Create logs directory
RUN mkdir -p logs

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health && echo "Health check succeeded" || exit 1

# Start the application
CMD ["bun", "run", "start"]