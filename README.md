To run:

1. start the dev server via npm run dev
2. start the redis container via
docker run -d \
  --name bullmq-redis \
  -p 6379:6379 \
  redis:7
3. start the worker via tsm workers/deployments.worker.ts
4. for caddy docker 


for redployment
- create a new docker container, on a new port
- if it is healthy, prune the old container (NOTE: add a new job in the prune queue only if the new container is healthy)
- set previous deployment status to stopped