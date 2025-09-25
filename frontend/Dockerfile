# Frontend Dockerfile

# 1) Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy source and build
COPY frontend/ .
# Accept base URL for backend at build time
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
RUN npm run build

# 2) Runtime stage (Nginx)
FROM nginx:alpine
# Copy SPA-friendly nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
# Copy built assets
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
