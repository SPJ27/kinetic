import { Worker } from "bullmq";
import "dotenv/config";
import { runCommand } from "@/lib/run-cmd";
import { generateCaddyFile } from "@/lib/caddy";

const worker = new Worker(
    "caddy",
    async (job) => {
        if (job.name === "mount-caddy") {
            const caddyLocation = '/etc/caddy/Caddyfile'
            const caddyFile = await generateCaddyFile()
            await runCommand("sudo", ["tee", "/etc/caddy/Caddyfile"], {cwd: process.cwd(), projectId: "na", stage: "deploy", captureOutput: true, writeLogs: false, stdin: caddyFile});
            await runCommand("sudo", ["caddy", "validate", "--config", "/etc/caddy/Caddyfile"], {cwd: process.cwd(),projectId: "na",stage: "deploy",captureOutput: true, writeLogs: false,});
            await runCommand("sudo", ["systemctl", "reload", "caddy"], {cwd: process.cwd(), projectId: "na", stage: "deploy", captureOutput: true, writeLogs: false, });
            console.log("Generated Caddyfile:\n", caddyFile)
        }
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
    console.log(`Caddy Job ${job.id} completed successfully.\n------------------`);
});

worker.on("failed", (job, err) => {
    console.error(`Caddy Job ${job?.id} failed with error: ${err.message}`);
});
