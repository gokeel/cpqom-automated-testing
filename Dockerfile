FROM mcr.microsoft.com/playwright:v1.59.1-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV CI=true
ENV HEADLESS=true

EXPOSE 3333

CMD ["node", "utils/run-server.js"]
