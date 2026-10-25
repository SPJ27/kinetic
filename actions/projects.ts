'use server'

import { deploymentQueue } from "@/queue/deployments.queue";

export async function createProject(formData: FormData) {
    const projectName = formData.get("projectName") as string;
    const githubUrl = formData.get("githubUrl") as string;
    const env = formData.get("env") as object || {};

    if (!projectName || !githubUrl) {
        throw new Error("Project name and GitHub URL are required");
    }

    const url = new URL(githubUrl);
    if (url.hostname !== "github.com") {
        throw new Error("Valid GitHub URL required");
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
        throw new Error("Valid project name required");
    }

    const job = await deploymentQueue.add(
        "deploy-from-github",
        { githubUrl, projectName ,env},
        {
          attempts: 2,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          removeOnComplete: 100,
          removeOnFail: 500,
        }
      );
}