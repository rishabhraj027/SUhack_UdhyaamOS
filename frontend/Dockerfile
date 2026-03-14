# Frontend Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

# Add ARG for VITE_API_URL and set as ENV so vite uses it during static compilation
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy package information and install dependencies
COPY package*.json ./
RUN npm install

# Copy source and config files and build
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY eslint.config.js ./
COPY components.json ./
COPY index.html ./
COPY src ./src
COPY public ./public
# .env.local isn't needed here if we inject ENV directly, but vite will read it if present

RUN npm run build

# Serve with a simple static server
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html

# Create an nginx configuration that supports SPA routing
RUN echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '  listen 80;' >> /etc/nginx/conf.d/default.conf && \
    echo '  location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '    root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    index index.html index.htm;' >> /etc/nginx/conf.d/default.conf && \
    echo '    try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '  }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
