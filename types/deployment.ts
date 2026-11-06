type LogStage =
  | "build"
  | "deploy"
  | "runtime"
  | "stats"
  | "install"
  | "test"
  | "healthcheck"
  | "prune";

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
  stdin?: string;
};

type PendingLog = {
  output: string;
  type: LogStream;
  projectId: string;
  createdAt: Date;
  logType: LogStage;
};