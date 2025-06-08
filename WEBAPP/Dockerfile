# Development stage
FROM node:18-alpine AS development

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port 3000 for development server
EXPOSE 3000

# Start development server with hot reload
CMD ["npm", "start"]

# Build stage
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy all source files including public directory
COPY public/ ./public/
COPY src/ ./src/
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY .env* ./

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 