FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run db:generate:postgres && npm run build
ENV NODE_ENV=production
EXPOSE 5000
USER node
CMD ["sh", "-c", "npm run db:migrate:postgres && npm start"]
