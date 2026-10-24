import { Worker } from "bullmq";
import "dotenv/config";
import { runCommand } from "@/lib/run-cmd";
import { parseUserEnv, toDockerEnvFile, toShellEnvFile } from "@/lib/deploy-env";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

const APPS_DIR = path.resolve("./applications");
const PROJECT_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,62}$/;
const MIN_PORT = 1024;
const MAX_PORT = 65535;

const MEMORY_LIMIT = "1g";
const CPU_LIMIT = "1";
const PIDS_LIMIT = "256";

const dockerFile = `
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci


FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN --mount=type=secret,id=build_env set -a && . /run/secrets/build_env && set +a && npm run build


FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup -S nodejs && \\
    adduser -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
`;

const dockerIgnore = `
node_modules
.next
.git
.env
.env.*
!.env.example
npm-debug.log*
Dockerfile*
.dockerignore
`;

function validateGithubUrl(raw: unknown): string {
  const invalid = new Error("Invalid GitHub repository URL");
  if (typeof raw !== "string") throw invalid;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw invalid;
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== "github.com" ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^\/[\w.-]+\/[\w.-]+\/?$/.test(url.pathname)
  ) {
    throw invalid;
  }

  return url.href;
}

function validateProjectName(raw: unknown): string {
  if (typeof raw !== "string" || !PROJECT_NAME_RE.test(raw)) {
    throw new Error("Invalid project name");
  }
  return raw;
}

function validatePort(raw: unknown): number {
  const port = Number(raw);
  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new Error(`Port must be an integer between ${MIN_PORT} and ${MAX_PORT}`);
  }
  return port;
}

const worker = new Worker(
  "deployments",
  async (job) => {
    if (job.name !== "deploy-from-github") return;

    const githubUrl = validateGithubUrl(job.data.githubUrl);
    const projectName = validateProjectName(job.data.projectName);
    const port = validatePort(job.data.port);
    const envVars = parseUserEnv(job.data.env);
    const secretValues = envVars.map(([, value]) => value);

    const repoPath = path.resolve(APPS_DIR, projectName);
    if (path.dirname(repoPath) !== APPS_DIR) {
      throw new Error("Invalid project name");
    }

    const deploymentId = crypto.randomUUID();
    const imageName = `deployment-${deploymentId}`;
    const containerName = `container-${deploymentId}`;

    const envDir = await mkdtemp(path.join(os.tmpdir(), "deploy-env-"));
    const runtimeEnvPath = path.join(envDir, "runtime.env");
    const buildEnvPath = path.join(envDir, "build.env");

    try {
      console.log(`Starting clone: ${githubUrl}`);
      await runCommand(
        "git",
        ["clone", "--depth", "1", "--progress", "--", githubUrl, projectName],
        APPS_DIR,
        false,
        { GIT_TERMINAL_PROMPT: "0" }
      );
      console.log("Repository cloned successfully!");

      console.log("Creating Dockerfile and .dockerignore...");
      await writeFile(path.join(repoPath, "Dockerfile"), dockerFile);
      await writeFile(path.join(repoPath, ".dockerignore"), dockerIgnore);

      await writeFile(runtimeEnvPath, toDockerEnvFile(envVars), { mode: 0o600 });
      await writeFile(buildEnvPath, toShellEnvFile(envVars), { mode: 0o600 });

      console.log(`Building Docker image: ${imageName}...`);
      await runCommand(
        "docker",
        ["build", "--secret", `id=build_env,src=${buildEnvPath}`, "-t", imageName, "."],
        repoPath,
        false,
        { DOCKER_BUILDKIT: "1" },
        secretValues
      );
      console.log(`Docker image ${imageName} built successfully!`);

      console.log(`Running Docker container from image: ${imageName}...`);
      await runCommand(
        "docker",
        [
          "run",
          "-d",
          "--name", containerName,
          "--restart", "unless-stopped",
          "--env-file", runtimeEnvPath,
          "-e", "NODE_ENV=production",
          "-e", "PORT=3000",
          "-e", "HOSTNAME=0.0.0.0",
          "--memory", MEMORY_LIMIT,
          "--cpus", CPU_LIMIT,
          "--pids-limit", PIDS_LIMIT,
          "--cap-drop", "ALL",
          "--security-opt", "no-new-privileges",
          "-p", `127.0.0.1:${port}:3000`,
          imageName,
        ],
        repoPath,
        false,
        {},
        secretValues
      );

      console.log(`Docker container from image ${imageName} is running successfully!`);
    } finally {
      await rm(envDir, { recursive: true, force: true });
    }

    return { success: true, githubUrl };
  },
  {
    connection: {
      host: process.env.REDIS_HOST ?? "127.0.0.1",
      port: Number(process.env.REDIS_PORT ?? 6379),
      maxRetriesPerRequest: null,
    },
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully.\n------------------`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed with error: ${err.message}`);
});