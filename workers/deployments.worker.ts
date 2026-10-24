import { Worker } from "bullmq";
import "dotenv/config";
import { runCommand } from "@/lib/run-cmd";
import { run } from "node:test";

const worker = new Worker(
  "deployments",
  async (job) => {
    if (job.name !== "deploy-from-github") return;

    const { githubUrl, projectName } = job.data;

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

    await runCommand(
      "git",
      ["clone", "--progress", "--", githubUrl, projectName],
      "./applications"
    );

    console.log("Repository cloned successfully!");
    console.log(`Installing dependencies for ${projectName}...`);

    await runCommand("npm", ["install"], `./applications/${projectName}`);
    console.log("Dependencies installed successfully!");
    console.log(`Building project ${projectName}...`);
    await runCommand("npm", ["run", "build"], `./applications/${projectName}`);
    console.log("Project built successfully!");
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