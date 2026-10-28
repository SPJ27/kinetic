import { db } from "@/db";
import { projects } from "@/db/schema";
import { auth } from "@/lib/auth/auth";
import { deploymentQueue } from "@/queue/deployments.queue";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    // add another job to the deployment queue
    // add another param called redeploy to job body
    // if successful, prune the previous deployment

    
    const {projectId, env} = await request.json();
    
    const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const {githubUrl} = project

    const deploymentId = crypto.randomUUID()

    const imageName = `deployment-${deploymentId}`;
    const containerName = `container-${deploymentId}`;

    const job = await deploymentQueue.add(
            "deploy-from-github",
            { githubUrl, projectName: project.name,projectId, env, deploymentId, imageName, containerName, redeploy: true },
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

}