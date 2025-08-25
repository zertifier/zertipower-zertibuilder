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
COPY package.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for Prisma generation)
RUN pnpm install --no-frozen-lockfile


# Generate Prisma client
RUN pnpx prisma generate

# Copy source code and build
COPY . .
RUN pnpm build

# Remove dev dependencies
RUN pnpm prune --prod

### Final image just node, node_modules and dist
FROM node:20-alpine3.18

# Remove any Prisma engine type overrides to use defaults

COPY ./backups ./backups
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src/shared/infrastructure/views ./src/shared/infrastructure/views
COPY --from=build /app/dist ./dist

ENTRYPOINT [ "node", "dist/main.js" ]
