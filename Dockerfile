FROM node:14-alpine AS BUILD_IMAGE

WORKDIR /app

COPY . /app

EXPOSE 8080

RUN npm i

RUN npm run gcp-build

RUN npm prune --production

FROM node:14-alpine

WORKDIR /app

COPY --from=BUILD_IMAGE /app/dist ./dist
COPY --from=BUILD_IMAGE /app/node_modules ./node_modules
COPY --from=BUILD_IMAGE /app/.env.production ./

ENV NODE_ENV=production

ENTRYPOINT [ "node", "dist/index.js" ]