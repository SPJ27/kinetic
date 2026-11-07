'use server'

import { db } from "@/db";
import { projects } from "@/db/schema/projects";
import { auth } from "@/lib/auth/auth";
import { encryptEnv } from "@/lib/encrypt";
import { deploymentQueue } from "@/queue/deployments.queue";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { pruneQueue } from "@/queue/prune.queue";
import { eq } from "drizzle-orm";
import { refresh } from "next/cache";

export async function createProject(formData: FormData) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return


    const githubUrl = formData.get("githubUrl") as string;
    const subdomain = formData.get("subdomain") as string || "kinetic";
    const env = formData.get("env") as string || 'TEST_VALUE=123';
    console.log({githubUrl, subdomain, env})

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
    const projectId = crypto.randomUUID();
    const deploymentId = crypto.randomUUID();
    const imageName = `deployment-${deploymentId}`;
    const containerName = `container-${deploymentId}`;

    const encryptedEnv = encryptEnv(env, projectId)

    const [created] = await db.insert(projects).values({
        id: projectId,
        name: projectName,
        githubUrl: githubUrl,
        dockerDeploymentId: deploymentId,
        userId: session.user.id,
        subdomain,
        encryptedEnv,
    }).returning()



    const job = await deploymentQueue.add(
        "deploy-from-github",
        { githubUrl, projectName, deploymentId, imageName, containerName, projectId: created.id, redeploy: false, userId: session.user.id },
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

export async function deleteProject(projectId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return

    const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        with: {
            deployments: true,
        }
    })

    if (!project) {
        throw new Error("Project not found");
    }

    if (project.userId !== session.user.id) {
        throw new Error("You do not have permission to delete this project");
    }

    await db.update(projects).set({ status: "deleted" }).where(eq(projects.id, projectId));
    for (const deployment of project.deployments) {
        const job = await pruneQueue.add('prune-deployment', { deploymentId: deployment.id })
    }
    refresh()
}