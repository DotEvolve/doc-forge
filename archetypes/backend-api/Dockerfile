FROM node:24-slim AS builder
WORKDIR /app
ARG NPM_TOKEN
ENV NPM_TOKEN=$NPM_TOKEN
COPY package*.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
ARG NPM_TOKEN
ENV NPM_TOKEN=$NPM_TOKEN
COPY .npmrc ./
RUN npm ci --omit=dev && rm -f .npmrc
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
