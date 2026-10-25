import { spawn } from "node:child_process";
import { db } from "@/db/index";
import { logs } from "@/db/schema/logs";

type RunCommandResult = {
  pid?: number;
};

type LogType = "stdout" | "stderr";

type CommandEnv = Record<string, string | undefined>;

type Redaction = string | RegExp;

type RunCommandOptions = {
  cwd: string;
  projectId: string;
  detached?: boolean;
  env?: CommandEnv;
  redact?: Redaction[];
  timeoutMs?: number;
};

type PendingLog = {
  output: string;
  type: LogType;
  projectId: string;
  createdAt: Date;
};

const BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 1000;
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;
const MIN_REDACT_LENGTH = 4;
const MAX_LINE_LENGTH = 64 * 1024;
const MASK = "[redacted]";
const ALWAYS_REDACT: RegExp[] = [/\b[0-9a-f]{64}\b/gi];
const PROGRESS_RE = /^(.*?:\s+)\d{1,3}%(?:\s|$)/;

const toGlobal = (re: RegExp) =>
  re.flags.includes("g") ? re : new RegExp(re.source, `${re.flags}g`);

export function runCommand(
  command: string,
  args: string[],
  {
    cwd,
    projectId,
    detached = false,
    env = {},
    redact = [],
    timeoutMs = DEFAULT_TIMEOUT_MS,
  }: RunCommandOptions
): Promise<RunCommandResult> {
  return new Promise((resolve, reject) => {
    const childEnv: CommandEnv = {
      ...env,
      PATH: process.env.PATH,
      HOME: process.env.HOME,
    };

    const child = spawn(command, args, {
      cwd,
      detached,
      stdio: detached ? "ignore" : ["ignore", "pipe", "pipe"],
      env: childEnv as unknown as NodeJS.ProcessEnv,
    });

    if (detached) {
      child.once("error", reject);
      child.once("spawn", () => {
        child.unref();
        resolve({ pid: child.pid });
      });
      return;
    }

    const literals = redact
      .filter((r): r is string => typeof r === "string" && r.length >= MIN_REDACT_LENGTH)
      .sort((a, b) => b.length - a.length);

    const patterns = [
      ...ALWAYS_REDACT,
      ...redact.filter((r): r is RegExp => r instanceof RegExp),
    ].map(toGlobal);

    const scrub = (text: string) => {
      let out = literals.reduce((acc, s) => acc.split(s).join(MASK), text);
      for (const re of patterns) out = out.replace(re, MASK);
      return out;
    };

    let pendingLogs: PendingLog[] = [];
    let writeChain = Promise.resolve();
    let logWriteFailed = false;
    let settled = false;
    let timedOut = false;

    function flushLogs() {
      if (pendingLogs.length === 0) return;

      const batch = pendingLogs;
      pendingLogs = [];

      writeChain = writeChain.then(async () => {
        try {
          await db.insert(logs).values(batch);
        } catch {
          logWriteFailed = true;
          console.error("Failed to persist command logs");
        }
      });
    }

    function addLog(output: string, type: LogType) {
      pendingLogs.push({ output, type, projectId, createdAt: new Date() });
      if (pendingLogs.length >= BATCH_SIZE) flushLogs();
    }

    const flushTimer = setInterval(flushLogs, FLUSH_INTERVAL_MS);

    const timeoutTimer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    const cleanup = () => {
      clearInterval(flushTimer);
      clearTimeout(timeoutTimer);
    };

    function createLineHandler(type: LogType) {
      let remainder = "";
      let progress: { key: string; line: string } | null = null;

      const write = (line: string) => {
        const clean = scrub(line);
        if (!clean.trim()) return;
        const stream = type === "stdout" ? process.stdout : process.stderr;
        stream.write(`[${type}] ${clean}\n`);
        addLog(`${clean}\n`, type);
      };

      const flushProgress = () => {
        if (progress) {
          write(progress.line);
          progress = null;
        }
      };

      const handleLine = (line: string) => {
        const match = PROGRESS_RE.exec(line);
        if (match) {
          const key = match[1];
          if (progress && progress.key !== key) flushProgress();
          progress = { key, line };
          return;
        }
        flushProgress();
        write(line);
      };

      return {
        push(chunk: string) {
          const parts = (remainder + chunk).split(/\r\n|\n|\r/);
          remainder = parts.pop() ?? "";
          parts.forEach(handleLine);
          if (remainder.length > MAX_LINE_LENGTH) {
            handleLine(remainder);
            remainder = "";
          }
        },
        end() {
          if (remainder) handleLine(remainder);
          remainder = "";
          flushProgress();
        },
      };
    }

    const stdoutLines = createLineHandler("stdout");
    const stderrLines = createLineHandler("stderr");

    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (chunk: string) => stdoutLines.push(chunk));
    child.stderr?.on("data", (chunk: string) => stderrLines.push(chunk));

    child.once("error", (error) => {
      cleanup();
      flushLogs();
      if (!settled) {
        settled = true;
        reject(new Error(scrub(error.message)));
      }
    });

    child.once("close", (code, signal) => {
      cleanup();
      stdoutLines.end();
      stderrLines.end();
      flushLogs();

      void writeChain.then(() => {
        if (settled) return;
        settled = true;

        if (logWriteFailed) {
          console.warn("Some logs could not be saved to the database.");
        }

        if (timedOut) {
          reject(new Error(`Command timed out after ${Math.round(timeoutMs / 1000)}s`));
        } else if (code === 0) {
          resolve({});
        } else {
          reject(new Error(`Command failed: exit code ${code}, signal ${signal}`));
        }
      });
    });
  });
}