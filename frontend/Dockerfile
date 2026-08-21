FROM node:22-alpine

WORKDIR /app

# Copy and install dependencies first (layer cache)
COPY package.json package-lock.json ./
RUN npm ci

# Copy rest of the application
COPY . .

# Set build arguments and environment variables
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NODE_ENV=production

# Build the Next.js production bundle
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
