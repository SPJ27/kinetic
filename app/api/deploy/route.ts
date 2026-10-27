import { db } from "@/db";
import { projects } from "@/db/schema/projects";
import { deploymentQueue } from "@/queue/deployments.queue";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { githubUrl, env } = await request.json();

const projectName = githubUrl
  .replace(/\/+$/, '')
  .split('/')
  .pop()
  ?.replace(/\.git$/, '')

  if (typeof githubUrl !== "string" ) {
    return NextResponse.json(
      { error: "Valid GitHub URL required" },
      { status: 400 }

    );
  }
  const url = new URL(githubUrl);
  if (url.hostname !== "github.com") {
    return NextResponse.json(
      { error: "Valid GitHub URL required" },
      { status: 400 }
    );
  }


  const job = await deploymentQueue.add(
    "deploy-from-github",
    { githubUrl, projectName, env },
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

  return NextResponse.json({
    message: "Job queued",
    jobId: job.id,
  });
}