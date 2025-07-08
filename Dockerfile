FROM node:20.11-alpine3.19 AS build

WORKDIR /app
COPY package*.json ./

RUN npm ci --only=dev

COPY . .

RUN npm run build --include=dev

FROM nginx:alpine

COPY --from=build /app/dist/wanderer-fe/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
