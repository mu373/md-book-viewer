# Base stage with pnpm
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Build stage
FROM base AS build
WORKDIR /usr/src/app

# Algolia search (client-side)
ARG NEXT_PUBLIC_ALGOLIA_APP_ID
ARG NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
ARG NEXT_PUBLIC_ALGOLIA_INDEX_NAME
ENV NEXT_PUBLIC_ALGOLIA_APP_ID=$NEXT_PUBLIC_ALGOLIA_APP_ID
ENV NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=$NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
ENV NEXT_PUBLIC_ALGOLIA_INDEX_NAME=$NEXT_PUBLIC_ALGOLIA_INDEX_NAME

COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . ./

# Verify books directory exists with actual content (not just symlinks)
# If books/ contains symlinks, they won't be followed by Docker COPY
# You must copy actual book files before building the Docker image
RUN if [ ! -d "./books" ]; then \
      echo "ERROR: books/ directory not found."; \
      echo "Please ensure books/ directory exists with actual book content before building."; \
      exit 1; \
    fi && \
    if [ -z "$(ls -A ./books)" ]; then \
      echo "ERROR: books/ directory is empty."; \
      echo "Docker COPY doesn't follow symlinks. Copy actual book files before building."; \
      exit 1; \
    fi

RUN pnpm build

# Production stage with Bun
FROM oven/bun:alpine AS runner
WORKDIR /app

# Copy built files from build stage
COPY --from=build --chown=bun:bun /usr/src/app/out ./out

# Copy server script
COPY --from=build --chown=bun:bun /usr/src/app/server.ts ./server.ts
COPY --from=build --chown=bun:bun /usr/src/app/node_modules/hono ./node_modules/hono

USER bun

# Expose port
EXPOSE 3000

# Start the application with Bun
CMD ["bun", "run", "server.ts"]
