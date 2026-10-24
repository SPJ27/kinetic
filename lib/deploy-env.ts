export type EnvVar = [key: string, value: string];

const KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const MAX_VARS = 100;
const MAX_KEY_LENGTH = 128;
const MAX_VALUE_LENGTH = 8 * 1024;
const MAX_TOTAL_LENGTH = 64 * 1024;

const RESERVED_KEYS = new Set([
  "NODE_ENV", "PORT", "HOSTNAME",
  "PATH", "HOME", "USER", "LOGNAME", "SHELL", "PWD", "OLDPWD",
  "IFS", "ENV", "BASH_ENV", "PS1", "PS2", "PS4",
]);
const RESERVED_PREFIXES = ["NODE_", "NPM_", "LD_"];

function isReserved(key: string) {
  const upper = key.toUpperCase();
  return (
    RESERVED_KEYS.has(upper) ||
    RESERVED_PREFIXES.some((p) => upper.startsWith(p)) ||
    (upper.startsWith("NEXT_") && !upper.startsWith("NEXT_PUBLIC_"))
  );
}

const label = (key: unknown) => JSON.stringify(String(key).slice(0, 64));

export function parseUserEnv(input: unknown): EnvVar[] {
  if (input == null) return [];

  let entries: [unknown, unknown][];
  if (Array.isArray(input)) {
    entries = input.map((item) => {
      const { key, value } = (item ?? {}) as { key?: unknown; value?: unknown };
      return [key, value] as [unknown, unknown];
    });
  } else if (typeof input === "object") {
    entries = Object.entries(input as Record<string, unknown>);
  } else {
    throw new Error("env must be an object or an array of { key, value }");
  }

  if (entries.length > MAX_VARS) {
    throw new Error(`Too many environment variables (max ${MAX_VARS})`);
  }

  const seen = new Set<string>();
  const result: EnvVar[] = [];
  let total = 0;

  for (const [key, value] of entries) {
    if (typeof key !== "string" || key.length > MAX_KEY_LENGTH || !KEY_RE.test(key)) {
      throw new Error(`Invalid environment variable name: ${label(key)}`);
    }
    if (isReserved(key)) {
      throw new Error(`Environment variable ${label(key)} is reserved and cannot be set`);
    }
    if (seen.has(key)) {
      throw new Error(`Duplicate environment variable: ${label(key)}`);
    }
    seen.add(key);

    if (typeof value !== "string") {
      throw new Error(`Value for ${label(key)} must be a string`);
    }
    if (value.length > MAX_VALUE_LENGTH) {
      throw new Error(`Value for ${label(key)} is too long (max ${MAX_VALUE_LENGTH} chars)`);
    }
    if (/[\0\r\n]/.test(value)) {
      throw new Error(`Value for ${label(key)} cannot contain newlines or null bytes`);
    }

    total += key.length + value.length;
    if (total > MAX_TOTAL_LENGTH) {
      throw new Error("Environment variables are too large in total");
    }

    result.push([key, value]);
  }

  return result;
}

export const toDockerEnvFile = (vars: EnvVar[]) =>
  vars.map(([k, v]) => `${k}=${v}`).join("\n") + "\n";

export const toShellEnvFile = (vars: EnvVar[]) =>
  vars.map(([k, v]) => `${k}='${v.replace(/'/g, `'\\''`)}'`).join("\n") + "\n";