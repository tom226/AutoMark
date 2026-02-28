# Node 20 Alpine-based Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy only the server-related package files
COPY server/package*.json ./server/

# Install server dependencies
RUN cd server && npm ci --production

# Copy the complete project
COPY . .

# Expose application port
EXPOSE 3001

# Start the application
CMD ["node", "server/index.js"]