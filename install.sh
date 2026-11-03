#!/bin/bash
set -e

PROJECT_DIR="/root/kinetic"

echo "=== Installing dependencies ==="

apt update
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | tee /etc/apt/sources.list.d/caddy-stable.list

apt update
apt install -y caddy docker.io

systemctl enable --now docker
systemctl enable --now caddy

echo "=== Installing Node dependencies ==="

cd "$PROJECT_DIR"

npm install
npm run build

echo "=== Creating Redis service ==="

cat > /etc/systemd/system/bullmq-redis.service <<'EOF'
[Unit]
Description=BullMQ Redis
After=docker.service
Requires=docker.service

[Service]
Restart=always
RestartSec=5
ExecStartPre=-/usr/bin/docker rm -f bullmq-redis
ExecStart=/usr/bin/docker run --name bullmq-redis -p 127.0.0.1:6379:6379 redis:7
ExecStop=/usr/bin/docker stop bullmq-redis

[Install]
WantedBy=multi-user.target
EOF

echo "=== Creating Kinetic application service ==="

cat > /etc/systemd/system/kinetic.service <<EOF
[Unit]
Description=Kinetic Next.js Application
After=network.target bullmq-redis.service
Requires=bullmq-redis.service

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "=== Creating deployment worker ==="

cat > /etc/systemd/system/kinetic-deployments.service <<EOF
[Unit]
Description=Kinetic Deployment Worker
After=network.target bullmq-redis.service
Requires=bullmq-redis.service

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/npx tsx workers/deployments.worker.ts
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "=== Creating prune worker ==="

cat > /etc/systemd/system/kinetic-prune.service <<EOF
[Unit]
Description=Kinetic Prune Worker
After=network.target bullmq-redis.service
Requires=bullmq-redis.service

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/npx tsx workers/prune.worker.ts
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "=== Creating Caddy worker ==="

cat > /etc/systemd/system/kinetic-caddy.service <<EOF
[Unit]
Description=Kinetic Caddy Worker
After=network.target bullmq-redis.service caddy.service
Requires=bullmq-redis.service

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/npx tsx workers/caddy.worker.ts
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "=== Enabling and starting services ==="

systemctl daemon-reload

systemctl enable bullmq-redis
systemctl enable kinetic
systemctl enable kinetic-deployments
systemctl enable kinetic-prune
systemctl enable kinetic-caddy

systemctl restart bullmq-redis
sleep 3

systemctl restart kinetic
systemctl restart kinetic-deployments
systemctl restart kinetic-prune
systemctl restart kinetic-caddy

echo "=== Service status ==="

systemctl --no-pager --full status bullmq-redis kinetic kinetic-deployments kinetic-prune kinetic-caddy caddy

echo "=== Kinetic setup completed ==="