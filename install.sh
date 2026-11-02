sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list

sudo apt update
sudo apt install caddy

npm install

npm run build
npm start

docker run -d \
  --name bullmq-redis \
  -p 6379:6379 \
  redis:7

npx tsx workers/deployments.worker.ts 
npx tsx workers/prune.worker.ts 
