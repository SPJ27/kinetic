
import { spawn } from "node:child_process";

type RunCommandResult = {
  pid?: number;
};

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
      stdio: detached
        ? "ignore"
        : ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    child.once("error", reject);

    if (detached) {
      child.once("spawn", () => {
        child.unref();
        resolve({ pid: child.pid });
      });

      return;
    }

    child.stdout?.on("data", (data: Buffer) => {
      process.stdout.write(`[stdout] ${data.toString()}`);
    });

    child.stderr?.on("data", (data: Buffer) => {
      process.stderr.write(`[stderr] ${data.toString()}`);
    });

    child.once("close", (code, signal) => {
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
}
