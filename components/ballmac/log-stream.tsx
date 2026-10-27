"use client"

import * as React from "react"
import { ArrowDown, Pause, Play, Search, WrapText } from "lucide-react"

import { CopyButton } from "@/components/ballmac/copy-button"
import { cn } from "@/lib/utils"
import { useMessages } from "@/lib/ballmac/i18n"

type LogLevel = "debug" | "info" | "warn" | "error"

type LogLine = {
  id: string | number
  time: string | number
  level: LogLevel
  message: string
  source?: string
}

const LEVELS: LogLevel[] = ["debug", "info", "warn", "error"]

const LEVEL_META: Record<LogLevel, { label: string; bar: string; chip: string }> = {
  debug: { label: "DEBUG", bar: "bg-muted-foreground/40", chip: "bg-muted" },
  info: { label: "INFO", bar: "bg-chart-1", chip: "bg-chart-1/10" },
  warn: { label: "WARN", bar: "bg-chart-3", chip: "bg-chart-3/15" },
  error: { label: "ERROR", bar: "bg-destructive", chip: "bg-destructive/10" },
}

function clock(time: string | number) {
  const d = new Date(time)
  if (Number.isNaN(d.getTime())) return "--:--:--.---"
  const p = (n: number, w = 2) => String(n).padStart(w, "0")
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}.${p(d.getUTCMilliseconds(), 3)}`
}

function isoOf(time: string | number) {
  const d = new Date(time)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const parts: React.ReactNode[] = []
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  let from = 0
  for (let at = lower.indexOf(q); at !== -1; at = lower.indexOf(q, from)) {
    if (at > from) parts.push(text.slice(from, at))
    parts.push(
      <mark key={at} className="rounded-[3px] bg-chart-3/40 px-px text-foreground">
        {text.slice(at, at + q.length)}
      </mark>
    )
    from = at + q.length
  }
  parts.push(text.slice(from))
  return <>{parts}</>
}

type LogStreamProps = Omit<React.ComponentProps<"div">, "title"> & {
  lines: LogLine[]
  title?: string
  maxLines?: number
  follow?: boolean
  height?: string
  wrap?: boolean
  hideSource?: boolean
  onClear?: () => void
  emptyText?: string
}

function LogStream({
  lines,
  title,
  maxLines = 1000,
  follow = true,
  height = "20rem",
  wrap: wrapProp = false,
  hideSource = false,
  onClear,
  emptyText,
  className,
  ...props
}: LogStreamProps) {
  const msg = useMessages()
  title ??= msg("log-stream.title", "Logs")
  emptyText ??= msg("log-stream.emptyText", "Waiting for output…")
  const [active, setActive] = React.useState<Set<LogLevel>>(new Set(LEVELS))
  const [query, setQuery] = React.useState("")
  const [wrap, setWrap] = React.useState(wrapProp)
  const [paused, setPaused] = React.useState(false)
  const [pausedAt, setPausedAt] = React.useState(0)
  const [atBottom, setAtBottom] = React.useState(true)
  const scroller = React.useRef<HTMLDivElement>(null)

  const source = paused ? lines.slice(0, pausedAt) : lines
  const q = query.trim()
  const visible = source
    .filter((l) => active.has(l.level) && (!q || l.message.toLowerCase().includes(q.toLowerCase()) || l.source?.toLowerCase().includes(q.toLowerCase())))
    .slice(-maxLines)
  const counts = LEVELS.reduce((acc, level) => ({ ...acc, [level]: source.filter((l) => l.level === level).length }), {} as Record<LogLevel, number>)
  const hiddenNew = paused ? lines.length - pausedAt : 0

  const newestId = visible[visible.length - 1]?.id
  React.useLayoutEffect(() => {
    const el = scroller.current
    if (el && follow && !paused && atBottom) el.scrollTop = el.scrollHeight
  }, [newestId, visible.length, follow, paused, atBottom])

  function onScroll() {
    const el = scroller.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 24)
  }

  function jump() {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
    setAtBottom(true)
    if (paused) setPaused(false)
  }

  const copyText = () =>
    visible.map((l) => `${isoOf(l.time) ?? l.time} ${l.level.toUpperCase()}${l.source ? ` [${l.source}]` : ""} ${l.message}`).join("\n")

  return (
    <div
      data-slot="log-stream"
      dir="ltr"
      className={cn("@container flex w-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <h3 className="me-1 text-sm font-semibold text-foreground">{title}</h3>
        <div role="group" aria-label={msg("log-stream.showLevels", "Show levels")} className="flex items-center gap-1">
          {LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              aria-pressed={active.has(level)}
              onClick={() =>
                setActive((set) => {
                  const next = new Set(set)
                  if (next.has(level)) next.delete(level)
                  else next.add(level)
                  return next
                })
              }
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 font-mono text-[11px] font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none",
                active.has(level) ? cn("text-foreground", LEVEL_META[level].chip) : "border-dashed text-muted-foreground line-through hover:text-foreground"
              )}
            >
              <span aria-hidden="true" className={cn("size-1.5 rounded-full", LEVEL_META[level].bar)} />
              {LEVEL_META[level].label}
              <span className="text-muted-foreground tabular-nums">{counts[level]}</span>
            </button>
          ))}
        </div>
        <div className="relative ms-auto min-w-36 flex-1 @xl:max-w-56 @xl:flex-none">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 start-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={msg("log-stream.filterLogLines", "Filter log lines")}
            placeholder={msg("log-stream.filter", "Filter")}
            className="h-7 w-full rounded-md border bg-background pe-2 ps-7 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-pressed={wrap}
            aria-label={msg("log-stream.wrapLongLines", "Wrap long lines")}
            title={msg("log-stream.wrapLongLines", "Wrap long lines")}
            onClick={() => setWrap((w) => !w)}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-accent aria-pressed:text-foreground"
          >
            <WrapText aria-hidden="true" className="size-3.5" />
          </button>
          <button
            type="button"
            aria-pressed={paused}
            aria-label={paused ? msg("log-stream.resumeStream", "Resume stream") : msg("log-stream.pauseStream", "Pause stream")}
            title={paused ? msg("log-stream.resumeStream", "Resume stream") : msg("log-stream.pauseStream", "Pause stream")}
            onClick={() => {
              setPausedAt(lines.length)
              setPaused((p) => !p)
            }}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-accent aria-pressed:text-foreground"
          >
            {paused ? <Play aria-hidden="true" className="size-3.5" /> : <Pause aria-hidden="true" className="size-3.5" />}
          </button>
          <CopyButton size="sm" ariaLabel="Copy visible lines" getValue={copyText} disabled={visible.length === 0} />
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="ms-0.5 h-7 rounded-md px-2 text-xs font-medium text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {msg("log-stream.clear", "Clear")}
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <div
          ref={scroller}
          role="log"
          aria-label={msg("log-stream.lines", "{title}, {length} lines", { title, length: visible.length })}
          aria-live="off"
          tabIndex={0}
          onScroll={onScroll}
          style={{ height }}
          className="overflow-auto bg-muted/20 py-1 font-mono text-xs leading-5 outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
        >
          {visible.length === 0 ? (
            <p className="px-4 py-6 text-center font-sans text-[13px] text-muted-foreground">{lines.length === 0 ? emptyText : "No lines match the filters."}</p>
          ) : (
            visible.map((l) => (
              <div
                key={l.id}
                data-level={l.level}
                className={cn(
                  "relative flex gap-3 py-px pe-4 ps-4 hover:bg-accent/60",
                  l.level === "error" && "bg-destructive/5",
                  l.level === "warn" && "bg-chart-3/5",
                  wrap ? "" : "w-max min-w-full"
                )}
              >
                <span aria-hidden="true" className={cn("absolute inset-y-0 start-0 w-0.5", LEVEL_META[l.level].bar)} />
                <time dateTime={isoOf(l.time)} className="shrink-0 text-muted-foreground tabular-nums">
                  {clock(l.time)}
                </time>
                <span className="w-11 shrink-0 font-medium text-foreground">{LEVEL_META[l.level].label}</span>
                {!hideSource && l.source && <span className="hidden w-16 shrink-0 truncate text-muted-foreground @xl:block">{l.source}</span>}
                <span className={cn("min-w-0 flex-1 text-foreground", wrap ? "break-words whitespace-pre-wrap" : "whitespace-pre")}>
                  <Highlight text={l.message} query={q} />
                </span>
              </div>
            ))
          )}
        </div>
        {(!atBottom || hiddenNew > 0) && visible.length > 0 && (
          <button
            type="button"
            onClick={jump}
            className="absolute end-3 bottom-3 inline-flex h-8 items-center gap-1.5 rounded-full border bg-popover px-3 text-xs font-medium text-popover-foreground shadow-md outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <ArrowDown aria-hidden="true" className="size-3.5" />
            {hiddenNew > 0 ? `${hiddenNew} new ${hiddenNew === 1 ? "line" : "lines"}` : "Jump to latest"}
          </button>
        )}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {paused ? "Stream paused" : ""}
      </p>
    </div>
  )
}

export { LogStream, clock, type LogStreamProps, type LogLine, type LogLevel }
