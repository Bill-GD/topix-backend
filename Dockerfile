FROM node:20.18.0

WORKDIR /app
COPY package*.json ./
RUN npm i

COPY .env.docker .env
COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/src/main"]
