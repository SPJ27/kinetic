"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { AlertCircle, Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMessages } from "@/lib/ballmac/i18n"

const copyButtonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md text-sm font-medium whitespace-nowrap outline-none transition-[color,background-color,border-color,box-shadow] duration-150 select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
        outline: "border bg-background text-foreground shadow-xs hover:bg-accent",
        solid: "bg-primary text-primary-foreground hover:bg-primary/90",
      },
      size: {
        sm: "h-7 text-xs [&_svg]:size-3.5",
        default: "h-8 text-[13px] [&_svg]:size-4",
        lg: "h-10 [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "ghost", size: "default" },
  }
)

/** Writes text to the clipboard, falling back to a hidden textarea where the async API is blocked (insecure origins, some iframes). */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement("textarea")
      area.value = text
      area.setAttribute("readonly", "")
      area.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none"
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand("copy")
      area.remove()
      return ok
    } catch {
      return false
    }
  }
}

type CopyButtonProps = Omit<React.ComponentProps<"button">, "value" | "onCopy" | "children"> &
  VariantProps<typeof copyButtonVariants> & {
    /** Text to copy. */
    value?: string
    /** Reads the text at click time instead, for content that changes (a selection, a form). May be async. */
    getValue?: () => string | Promise<string>
    /** Visible label next to the icon, such as "Copy". Leave out for an icon-only button. */
    label?: string
    /** Label shown after a successful copy. */
    copiedLabel?: string
    /** Accessible name of an icon-only button. */
    ariaLabel?: string
    /** How long the confirmation stays, in milliseconds. */
    resetAfter?: number
    /** Called with the copied text. */
    onCopied?: (text: string) => void
    /** Called when both clipboard routes fail. */
    onError?: () => void
  }

function CopyButton({
  value,
  getValue,
  label,
  copiedLabel,
  ariaLabel,
  resetAfter = 1800,
  onCopied,
  onError,
  variant,
  size,
  className,
  onClick,
  ...props
}: CopyButtonProps) {
  const msg = useMessages()
  copiedLabel ??= msg("copy-button.copiedLabel", "Copied")
  ariaLabel ??= msg("copy-button.ariaLabel", "Copy to clipboard")
  const reduce = useReducedMotion()
  const [state, setState] = React.useState<"idle" | "copied" | "failed">("idle")
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  React.useEffect(() => () => clearTimeout(timer.current), [])

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event)
    if (event.defaultPrevented) return
    const text = getValue ? await getValue() : (value ?? "")
    const ok = await copyText(text)
    setState(ok ? "copied" : "failed")
    if (ok) onCopied?.(text)
    else onError?.()
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState("idle"), resetAfter)
  }

  const word = state === "copied" ? copiedLabel : state === "failed" ? "Copy failed" : label
  const Icon = state === "copied" ? Check : state === "failed" ? AlertCircle : Copy

  return (
    <>
      <button
        type="button"
        data-slot="copy-button"
        data-state={state}
        aria-label={word ?? ariaLabel}
        title={word ?? ariaLabel}
        onClick={handleClick}
        className={cn(
          copyButtonVariants({ variant, size }),
          label ? { sm: "px-2", default: "px-2.5", lg: "px-3.5" }[size ?? "default"] : { sm: "w-7", default: "w-8", lg: "w-10" }[size ?? "default"],
          state === "copied" && "text-foreground",
          className
        )}
        {...props}
      >
        <span aria-hidden="true" className="relative flex items-center justify-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={state}
              className="flex"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5, rotate: -45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 520, damping: 30 }}
            >
              <Icon className={cn(state === "copied" && "text-chart-2", state === "failed" && "text-destructive")} />
            </motion.span>
          </AnimatePresence>
        </span>
        {label && (
          <span data-label="" aria-hidden="true">
            {word}
          </span>
        )}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {state === "copied" ? "Copied to clipboard" : state === "failed" ? "Copy failed" : ""}
      </span>
    </>
  )
}

export { CopyButton, copyButtonVariants, copyText, type CopyButtonProps }
