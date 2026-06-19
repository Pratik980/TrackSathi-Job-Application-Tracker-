FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS dev
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM base AS build
COPY . .
RUN npm run build

FROM node:22-alpine AS prod
WORKDIR /app
COPY --from=build /app/.output /app/.output
COPY --from=build /app/node_modules /app/node_modules
COPY package.json /app/
EXPOSE 3000
CMD ["node", "/app/.output/server/index.mjs"]
