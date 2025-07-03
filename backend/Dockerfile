### Base image for build steps
#FROM node:20-alpine3.18 AS base
#
### Preparing pnpm
#ENV PNPM_HOME="/pnpm"
#ENV PATH="$PNPM_HOME:$PATH"
#RUN npm i -g pnpm
#
#### Generating prisma client
#FROM base as prisma
#
#WORKDIR /src
#COPY . .
#
#RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install -D
#RUN pnpx prisma generate
#
#### Build image installing just production dependencies and getting prisma from
#### previous step
#FROM base AS build
#WORKDIR /app
#COPY --from=prisma /src .
#
#RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
#RUN pnpm build
#
#### Final image just node, node_modules and dist
#FROM node:20-alpine3.18
#
#COPY ./backups ./backups
#COPY --from=build /app/node_modules ./node_modules
#COPY --from=build /app/src/shared/infrastructure/views ./src/shared/infrastructure/views
#COPY --from=build /app/dist ./dist

FROM node:20-alpine as build

## Preparing pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm i -g pnpm

WORKDIR /src
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile
RUN pnpx prisma generate
RUN pnpm build


ENTRYPOINT [ "node", "dist/main.js" ]
