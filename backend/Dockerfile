### Base image for build steps
FROM node:20-alpine3.18 AS base

## Preparing pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm i -g pnpm

### Build image with dependencies and Prisma generation
FROM base AS build
WORKDIR /app

# Copy package files first
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for Prisma generation)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpx prisma generate

# Copy source code and build
COPY . .
RUN pnpm build

# Remove dev dependencies
RUN pnpm prune --prod

### Final image just node, node_modules and dist
FROM node:20-alpine3.18

# Ensure Prisma uses the correct engine
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

COPY ./backups ./backups
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src/shared/infrastructure/views ./src/shared/infrastructure/views
COPY --from=build /app/dist ./dist

ENTRYPOINT [ "node", "dist/main.js" ]
