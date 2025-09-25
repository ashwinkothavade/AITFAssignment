# Backend Dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (leverage Docker layer cache)
COPY backend/package*.json ./
RUN npm install --production

# Bundle app source
COPY backend/ .

ENV NODE_ENV=production
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
