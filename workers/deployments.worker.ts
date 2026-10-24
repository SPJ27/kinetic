import { Worker } from "bullmq";
import "dotenv/config";
import { runCommand } from "@/lib/run-cmd";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const dockerFile = `

# ---------- Dependencies ----------
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci


# ---------- Build ----------
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


# ---------- Production ----------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Run the application as a non-root user.
RUN addgroup -S nodejs && \
    adduser -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]

`

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
`

const worker = new Worker(
    "deployments",
    async (job) => {
        if (job.name !== "deploy-from-github") return;

        const { githubUrl, projectName, port } = job.data;

        const url = new URL(githubUrl);

        if (
            url.protocol !== "https:" ||
            url.hostname !== "github.com" ||
            url.username ||
            url.password
        ) {
            throw new Error("Invalid GitHub repository URL");
        }

        console.log(`Starting clone: ${githubUrl}`);
        try {
            await runCommand(
                "git",
                ["clone", "--progress", "--", githubUrl, projectName],
                "./applications"
            );
        } catch (error: any) {
            
        }

        console.log("Repository cloned successfully!");
        console.log(`Installing dependencies for ${projectName}...`);


        const repoPath = path.resolve("./applications", projectName);
        const dockerfilePath = path.join(repoPath, "Dockerfile");
        const dockerignorePath = path.join(repoPath, ".dockerignore");

        console.log("Creating Dockerfile and .dockerignore...");

        try {
            await writeFile(dockerfilePath, dockerFile);
            await writeFile(dockerignorePath, dockerIgnore);
        } catch (error: any) {
            console.error(`Failed to create Dockerfile or .dockerignore: ${error.message}`);
            throw error;
        }

        console.log("Dockerfile and .dockerignore created successfully!");


        const deploymentId = crypto.randomUUID();
        const imageName = `deployment-${deploymentId}`;

        console.log(`Building Docker image: ${imageName}...`);

        try {
            await runCommand(
                "docker",
                ["build", "-t", imageName, "."],
                repoPath
            );
        } catch (error: any) {
            console.error(`Failed to build Docker image: ${error.message}`);
            throw error;
        }

        console.log(`Docker image ${imageName} built successfully!`);

        console.log(`Running Docker container from image: ${imageName}...`);

        const containerName = `container-${deploymentId}`;

        try {
            await runCommand(
                "docker",
                [
                    "run",
                    "-d",
                    "--name", containerName,
                    "--restart", "unless-stopped",
                    "-p", `127.0.0.1:${port}:3000`,
                    imageName,
                ], repoPath
            );
        } catch (error: any) {
            console.error(`Failed to run Docker container: ${error.message}`);
            throw error;
        }

        console.log(`Docker container from image ${imageName} is running successfully!`);

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