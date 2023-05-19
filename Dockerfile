FROM node:18-slim

RUN apt-get update && apt-get install -yq \
  build-essential \
  python3

RUN ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

ENV NODE_ENV=development
ENV PORT=3000

RUN mkdir tmp && chmod 777 tmp

CMD ["bash", "-c", "npx knex migrate:latest && npm start"]