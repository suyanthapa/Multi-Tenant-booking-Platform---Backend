# syntax=docker/dockerfile:1.4
FROM node:20

WORKDIR /app

# 1. Dependencies — cached unless package*.json changes
COPY package*.json ./
RUN npm ci

# 2. Prisma client — cached unless schema changes
COPY prisma ./prisma
RUN npx prisma generate

# 3. Config files that rarely change
COPY tsconfig.json ./

# 4. Source — changes most often, so it's last (busts cache least often overall)
COPY src ./src

EXPOSE 3002
CMD ["npm", "run", "dev"]