# Built and pushed to ghcr.io by .github/workflows/update.yml.
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server ./server
COPY --from=build /app/dist ./dist
# users.json and progress.json live here; mount it from the host.
VOLUME /app/server/data
EXPOSE 3000
CMD ["node", "server/index.js"]
