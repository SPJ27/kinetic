import { Worker } from "bullmq";
import "dotenv/config";
import { runCommand } from "@/lib/run-cmd";
import { rm } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { deployments } from "@/db/schema/deployments";
import { eq } from "drizzle-orm";

const worker = new Worker(
    "prune",
    async (job) => {
        if (job.name === "prune-deployment") {
        const {deploymentId} = job.data;

        const deployment = await db.query.deployments.findFirst({
            where: eq(deployments.id, deploymentId),
            with: {
                project: true,
            },
        });

        
        if (!deployment) {
            throw new Error(`Deployment ${deploymentId} not found`);
        }

        const projectId = deployment?.project.id;

        if (!projectId) {
                    throw new Error(`Project ID not found for deployment ${deploymentId}`);
                }
        const projectName = deployment.project.name;
        const containerName = `container-${deployment.dockerDeploymentId}`;
        const imageName = `deployment-${deployment.dockerDeploymentId}`;
        
        console.log(`Removing container ${containerName} for project ${projectName}`);
        await runCommand("docker", ["rm", "-f", containerName], {
            cwd: process.cwd(),
            projectId,
            stage: "prune",
            captureOutput: true,
            writeLogs: false,
        });
        console.log('Container removed successfully');

        console.log(`Removing image ${imageName} for project ${projectName}`);
        await runCommand("docker", ["rmi", imageName], {
            cwd: process.cwd(),
            projectId,
            stage: "prune",
            captureOutput: true,
            writeLogs: false,
        });
        console.log('Image removed successfully');

        console.log('Removing project directory');
        const projectDir = path.resolve(process.cwd(), "applications", deployment.id)

        await rm(projectDir, { recursive: true, force: true });
        console.log('Project directory removed successfully');

        console.log(`Updating deployment record ${deploymentId} for project ${projectName}`);

        await db.update(deployments).set({
            status: "pruned",
        }).where(eq(deployments.id, deploymentId));
        
        console.log(`Deployment ${deploymentId} for project ${projectName} pruned successfully`);
    }},
    {
        connection: {
            host: process.env.REDIS_HOST ?? "127.0.0.1",
            port: Number(process.env.REDIS_PORT ?? 6379),
            maxRetriesPerRequest: null,
        },
    }
);

worker.on("completed", (job) => {
    console.log(`Prune Job ${job.id} completed successfully.\n------------------`);
});

worker.on("failed", (job, err) => {
    console.error(`Prune Job ${job?.id} failed with error: ${err.message}`);
});
