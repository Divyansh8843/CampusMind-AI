# Build Stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy the rest of the source code
COPY . .

# If the server requires a build step (like TypeScript), it goes here
# RUN npm run build

# Production Stage
FROM node:20-alpine AS production

# Set NODE_ENV to production
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application files from the builder
COPY --from=builder /app ./

# Create a non-root user to run the application for security
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp \
    && chown -R nodeapp:nodeapp /app

# Switch to the non-root user
USER nodeapp

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
