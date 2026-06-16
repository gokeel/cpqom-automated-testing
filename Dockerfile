FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

RUN npx playwright install --with-deps chromium

COPY . .

ENV CI=true
ENV HEADLESS=true

EXPOSE 3333
EXPOSE 9323
EXPOSE 8100

CMD ["node", "utils/run-server.js"]
