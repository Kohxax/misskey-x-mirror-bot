# Builder
FROM node:22 AS builder
 
WORKDIR /app
 
COPY package*.json ./
RUN npm install
 
COPY . .
RUN npx tsc
 
# Production
FROM node:22-alpine
 
ENV TZ=Asia/Tokyo
 
WORKDIR /app
 
COPY package*.json ./
RUN npm install --omit=dev
 
COPY --from=builder /app/dist ./dist
 
# CookieとstoreのJSONを永続化するディレクトリ
VOLUME ["/app/data"]
 
CMD ["node", "dist/index.js"]
 