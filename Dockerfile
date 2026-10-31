FROM node:20-alpine as build
WORKDIR /usr/src/app
# Сначала манифесты: слой зависимостей не инвалидится при
# изменении исходников.
COPY package*.json ./
RUN npm install --no-audit --no-fund
# Контент (content/*.md) вшивается в бандл при сборке.
COPY . ./
RUN npm run build

FROM nginx:1.25-alpine-slim
EXPOSE 80
RUN rm -f /etc/nginx/conf.d/default.conf
COPY cfg/nginx.conf /etc/nginx/conf.d/falokut-site.conf
COPY --from=build /usr/src/app/build /usr/share/nginx/html
