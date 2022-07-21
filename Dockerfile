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
COPY --from=BUILD_IMAGE /app/.env.buildtest ./
COPY --from=BUILD_IMAGE /app/key.json ./

ENV NODE_ENV=production
ENV GOOGLE_APPLICATION_CREDENTIALS='key.json'

ENTRYPOINT [ "node", "dist/index.js" ]