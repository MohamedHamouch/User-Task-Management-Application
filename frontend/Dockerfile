FROM node:22-alpine

WORKDIR /app

# Copy and install dependencies first (layer cache)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy rest of the application
COPY . .

# Build the Next.js production bundle
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
