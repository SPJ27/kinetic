'use server'

import { db } from "@/db";
import { projects } from "@/db/schema/projects";
import { auth } from "@/lib/auth/auth";
import { deploymentQueue } from "@/queue/deployments.queue";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {
    const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return 


    const githubUrl = formData.get("githubUrl") as string;
    const env = formData.get("env") as object || {};


const projectName = githubUrl
  .replace(/\/+$/, '')
  .split('/')
  .pop()
  ?.replace(/\.git$/, '')


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

    const deploymentId = crypto.randomUUID();
    const imageName = `deployment-${deploymentId}`;
    const containerName = `container-${deploymentId}`;

    const [created] = await db.insert(projects).values({
        name: projectName,
        githubUrl: githubUrl,
        dockerDeploymentId: deploymentId,
    }).returning()

    

    const job = await deploymentQueue.add(
        "deploy-from-github",
        { githubUrl, projectName, env, deploymentId, imageName, containerName, projectId: created.id, redeploy: false },
        {
            attempts: 1,
            backoff: {
                type: "exponential",
                delay: 1000,
            },
            removeOnComplete: 100,
            removeOnFail: 500,
        }
    );
    redirect(`/projects/${created.id}`);
}