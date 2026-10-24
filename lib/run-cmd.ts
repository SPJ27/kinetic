
import { spawn } from "node:child_process";
import { db } from "@/db/index";
import { logs } from "@/db/schema/logs";

type RunCommandResult = {
  pid?: number;
};

type LogType = "stdout" | "stderr";

const BATCH_SIZE = 20;

export function runCommand(
  command: string,
  args: string[],
  cwd: string,
  detached = false
): Promise<RunCommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      detached,
      stdio: detached ? "ignore" : ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    if (detached) {
      child.once("error", reject);
      child.once("spawn", () => {
        child.unref();
        resolve({ pid: child.pid });
      });
      return;
    }

    let pendingLogs: { output: string; type: LogType }[] = [];
    let writeChain = Promise.resolve();
    let logWriteFailed = false;
    let settled = false;

    function flushLogs() {
      if (pendingLogs.length === 0) return;

      const batch = pendingLogs;
      pendingLogs = [];

      writeChain = writeChain.then(async () => {
        try {
          await db.insert(logs).values(batch);
        } catch (error) {
          logWriteFailed = true;
          console.error("Failed to persist command logs:", error);
        }
      });
    }

    function addLog(output: string, type: LogType) {
      pendingLogs.push({ output, type });

      if (pendingLogs.length >= BATCH_SIZE) {
        flushLogs();
      }
    }

    child.stdout?.on("data", (data: Buffer) => {
      const output = data.toString();
      process.stdout.write(`[stdout] ${output}`);
      addLog(output, "stdout");
    });

    child.stderr?.on("data", (data: Buffer) => {
      const output = data.toString();
      process.stderr.write(`[stderr] ${output}`);
      addLog(output, "stderr");
    });

    child.once("error", (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });

    child.once("close", (code, signal) => {
      flushLogs();

      void writeChain.then(() => {
        if (settled) return;
        settled = true;

        if (logWriteFailed) {
          console.warn(
            "Some logs could not be saved to the database."
          );
        }

        if (code === 0) {
          resolve({});
        } else {
          reject(
            new Error(
              `Command failed: exit code ${code}, signal ${signal}`
            )
          );
        }
      });
    });
  });
}
