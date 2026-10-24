import { spawn } from "node:child_process";

export function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.on("data", (data: Buffer) => {
      process.stdout.write(`[stdout] ${data.toString()}`);
    });

    child.stderr.on("data", (data: Buffer) => {
      process.stderr.write(`[stderr] ${data.toString()}`);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code, signal) => {
      if (code === 0) {
        resolve();
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