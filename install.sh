npm install

npm run dev

docker run -d \
  --name bullmq-redis \
  -p 6379:6379 \
  redis:7

npx tsx workers/deployments.worker.ts