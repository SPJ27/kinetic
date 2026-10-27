export type EnvVar = [key: string, value: string]

const KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/
const MAX_VARS = 100
const MAX_KEY_LENGTH = 128
const MAX_VALUE_LENGTH = 8 * 1024
const MAX_TOTAL_LENGTH = 64 * 1024

const RESERVED_KEYS = new Set(["NODE_ENV","PORT", "HOSTNAME","PATH","HOME","USER","LOGNAME","SHELL","PWD","OLDPWD", "IFS", "ENV", "BASH_ENV", "PS1", "PS2", "PS4",])

const RESERVED_PREFIXES = ["NODE_", "NPM_", "LD_"]

function isReserved(key: string) {
  const upper = key.toUpperCase()

  return (
    RESERVED_KEYS.has(upper) ||
    RESERVED_PREFIXES.some((prefix) => upper.startsWith(prefix)) ||
    (upper.startsWith("NEXT_") &&
      !upper.startsWith("NEXT_PUBLIC_"))
  )
}

const label = (key: unknown) =>
  JSON.stringify(String(key).slice(0, 64))

export function parseUserEnv(input: unknown): EnvVar[] {
  if (input == null) return []

  let entries: [unknown, unknown][]

  if (Array.isArray(input)) {
    entries = input.map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("key" in item) ||
        !("value" in item)
      ) {
        throw new Error("Each environment entry must contain key and value")
      }

      return [
        (item as { key: unknown }).key,
        (item as { value: unknown }).value,
      ]
    })
  } else if (
    typeof input === "object" &&
    Object.getPrototypeOf(input) === Object.prototype
  ) {
    entries = Object.entries(input as Record<string, unknown>)
  } else {
    throw new Error("env must be a plain object or an array of { key, value }")
  }

  if (entries.length > MAX_VARS) {
    throw new Error(`Too many environment variables (max ${MAX_VARS})`)
  }

  const seen = new Set<string>()
  const result: EnvVar[] = []
  let total = 0

  for (const [key, value] of entries) {
    if (
      typeof key !== "string" ||
      key.length > MAX_KEY_LENGTH ||
      !KEY_RE.test(key)
    ) {
      throw new Error(`Invalid environment variable name: ${label(key)}`)
    }

    if (isReserved(key)) {
      throw new Error(
        `Environment variable ${label(key)} is reserved`
      )
    }

    if (seen.has(key)) {
      throw new Error(`Duplicate environment variable: ${label(key)}`)
    }

    if (typeof value !== "string") {
      throw new Error(`Value for ${label(key)} must be a string`)
    }

    if (value.length > MAX_VALUE_LENGTH) {
      throw new Error(`Value for ${label(key)} is too long`)
    }

    if (/[\0\r\n]/.test(value)) {
      throw new Error(
        `Value for ${label(key)} cannot contain null bytes or newlines`
      )
    }

    seen.add(key)
    total += key.length + value.length

    if (total > MAX_TOTAL_LENGTH) {
      throw new Error("Environment variables are too large in total")
    }

    result.push([key, value])
  }

  return result
}

export function toDockerEnvFile(vars: EnvVar[]) {
  return vars.map(([key, value]) => `${key}=${value}`).join("\n") + "\n"
}

function shellQuote(value: string) {
  return "'" + value.replace(/'/g, "'\\''") + "'"
}

export function toShellEnvFile(vars: EnvVar[]) {
  return (
    vars
      .map(([key, value]) => `${key}=${shellQuote(value)}`)
      .join("\n") + "\n"
  )
}
