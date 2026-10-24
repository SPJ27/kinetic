To run:

1. start the dev server via npm run dev
2. start the redis container via
docker run -d \
  --name bullmq-redis \
  -p 6379:6379 \
  redis:7
3. start the worker via tsm workers/deployments.worker.ts