
import { spawn } from "node:child_process";
import { workerDb as db } from "@/db/worker";
import { logs } from "@/db/schema/logs";

export type LogStage =
  | "build"
  | "deploy"
  | "runtime"
  | "stats"
  | "install"
  | "test"
  | "healthcheck"
  | "prune"
  ;

type LogStream = "stdout" | "stderr";

type CommandEnv = Record<string, string | undefined>;
type Redaction = string | RegExp;

type RunCommandResult = {
  pid?: number;
  stdout?: string;
  stderr?: string;
};

type RunCommandOptions = {
  cwd: string;
  projectId: string;
  stage: LogStage;
  detached?: boolean;
  env?: CommandEnv;
  redact?: Redaction[];
  timeoutMs?: number;
  captureOutput?: boolean;
  writeLogs?: boolean;
};

type PendingLog = {
  output: string;
  type: LogStream;
  projectId: string;
  createdAt: Date;
  logType: LogStage;
};

const BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 1000;
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;
const MIN_REDACT_LENGTH = 4;
const MAX_LINE_LENGTH = 64 * 1024;
const MASK = "[redacted]";

const ALWAYS_REDACT: RegExp[] = [
  /\b[0-9a-f]{64}\b/gi,
];

const PROGRESS_RE = /^(.*?:\s+)\d{1,3}%(?:\s|$)/;

const toGlobal = (re: RegExp) =>
  re.flags.includes("g")
    ? re
    : new RegExp(re.source, `${re.flags}g`);

export function runCommand(
  command: string,
  args: string[],
  {
    cwd,
    projectId,
    stage,
    detached = false,
    env = {},
    redact = [],
    timeoutMs = DEFAULT_TIMEOUT_MS,
    captureOutput = false,
    writeLogs = true,
  }: RunCommandOptions
): Promise<RunCommandResult> {
  return new Promise((resolve, reject) => {
    const childEnv: CommandEnv = {
      ...env,
      PATH: env.PATH ?? process.env.PATH,
      HOME: env.HOME ?? process.env.HOME,
    };

    const child = spawn(command, args, {
      cwd,
      detached,
      stdio: detached
        ? "ignore"
        : ["ignore", "pipe", "pipe"],
      env: childEnv as NodeJS.ProcessEnv,
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
      .filter(
        (value): value is string =>
          typeof value === "string" &&
          value.length >= MIN_REDACT_LENGTH
      )
      .sort((a, b) => b.length - a.length);

    const patterns = [
      ...ALWAYS_REDACT,
      ...redact.filter(
        (value): value is RegExp =>
          value instanceof RegExp
      ),
    ].map(toGlobal);

    const scrub = (text: string) => {
      let output = literals.reduce(
        (acc, secret) =>
          acc.split(secret).join(MASK),
        text
      );

      for (const pattern of patterns) {
        output = output.replace(pattern, MASK);
      }

      return output;
    };

    let pendingLogs: PendingLog[] = [];
    let writeChain: Promise<void> = Promise.resolve();
    let logWriteFailed = false;
    let settled = false;
    let timedOut = false;

    const capturedStdout: string[] = [];
    const capturedStderr: string[] = [];

    function flushLogs() {
        if (!writeLogs) return
      if (pendingLogs.length === 0) return;

      const batch = pendingLogs;
      pendingLogs = [];

      writeChain = writeChain.then(async () => {
        try {
          await db.insert(logs).values(batch);
        } catch (error) {
          logWriteFailed = true;
          console.error("Failed to persist command logs", error);
        }
      });
    }

    function addLog(
      output: string,
      stream: LogStream
    ) {
      pendingLogs.push({
        output,
        type: stream,
        projectId,
        createdAt: new Date(),
        logType: stage,
      });

      if (pendingLogs.length >= BATCH_SIZE) {
        flushLogs();
      }
    }

    const flushTimer = setInterval(
      flushLogs,
      FLUSH_INTERVAL_MS
    );

    const timeoutTimer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    const cleanup = () => {
      clearInterval(flushTimer);
      clearTimeout(timeoutTimer);
    };

    function createLineHandler(stream: LogStream) {
      let remainder = "";
      let progress: {
        key: string;
        line: string;
      } | null = null;

      const write = (line: string) => {
        const clean = scrub(line);

        if (!clean.trim()) return;

        const outputStream =
          stream === "stdout"
            ? process.stdout
            : process.stderr;

        outputStream.write(`[${stream}] ${clean}\n`);

        if (captureOutput) {
          const target =
            stream === "stdout"
              ? capturedStdout
              : capturedStderr;

          target.push(clean);
        }

        addLog(`${clean}\n`, stream);
      };

      const flushProgress = () => {
        if (!progress) return;

        write(progress.line);
        progress = null;
      };

      const handleLine = (line: string) => {
        const match = PROGRESS_RE.exec(line);

        if (match) {
          const key = match[1];

          if (progress && progress.key !== key) {
            flushProgress();
          }

          progress = { key, line };
          return;
        }

        flushProgress();
        write(line);
      };

      return {
        push(chunk: string) {
          const parts = (
            remainder + chunk
          ).split(/\r\n|\n|\r/);

          remainder = parts.pop() ?? "";

          parts.forEach(handleLine);

          if (remainder.length > MAX_LINE_LENGTH) {
            handleLine(remainder);
            remainder = "";
          }
        },

        end() {
          if (remainder) {
            handleLine(remainder);
          }

          remainder = "";
          flushProgress();
        },
      };
    }

    const stdoutLines = createLineHandler("stdout");
    const stderrLines = createLineHandler("stderr");

    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");

    child.stdout?.on("data", (chunk: string) => {
      stdoutLines.push(chunk);
    });

    child.stderr?.on("data", (chunk: string) => {
      stderrLines.push(chunk);
    });

    child.once("error", (error) => {
      cleanup();

      stdoutLines.end();
      stderrLines.end();
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
          console.warn(
            "Some logs could not be saved to the database."
          );
        }

        if (timedOut) {
          reject(
            new Error(
              `Command timed out after ${Math.round(
                timeoutMs / 1000
              )}s`
            )
          );
          return;
        }

        if (code !== 0) {
          reject(
            new Error(
              `Command failed: exit code ${code}, signal ${signal}`
            )
          );
          return;
        }

        resolve({
          ...(captureOutput
            ? {
                stdout: capturedStdout.join("\n"),
                stderr: capturedStderr.join("\n"),
              }
            : {}),
        });
      });
    });
  });
}