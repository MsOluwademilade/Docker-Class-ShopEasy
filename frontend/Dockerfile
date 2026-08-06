# Build
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Runtime
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]