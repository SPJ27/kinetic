
import { pruneQueue } from "@/queue/prune.queue";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { deploymentId } = await request.json();



  const job = await pruneQueue.add(
    "prune-deployment",
    { deploymentId },
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

  return NextResponse.json({
    message: "Job queued",
    jobId: job.id,
  });
}