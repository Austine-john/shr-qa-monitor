# Stage 1: build frontend
FROM node:22-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: backend runtime
FROM node:22-slim AS runtime
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./
# Place built frontend where server.js expects it: ../../frontend/dist relative to src/
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

RUN mkdir -p data

EXPOSE 3001
CMD ["node", "src/server.js"]
