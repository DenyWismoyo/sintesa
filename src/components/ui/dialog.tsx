"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, XIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DialogPageModeContextValue {
  isPageMode: boolean
  backHref?: string
  backLabel?: string
  pageTitle?: string
  pageSubtitle?: string
  badgeText?: string
  onClosePage?: () => void
}

const DialogPageModeContext = React.createContext<DialogPageModeContextValue>({
  isPageMode: false,
})

export function useDialogPageMode() {
  return React.useContext(DialogPageModeContext)
}

export function DialogPageModeProvider({
  children,
  backHref,
  backLabel = "Kembali",
  pageTitle,
  pageSubtitle,
  badgeText,
  onClosePage,
}: {
  children: React.ReactNode
  backHref?: string
  backLabel?: string
  pageTitle?: string
  pageSubtitle?: string
  badgeText?: string
  onClosePage?: () => void
}) {
  return (
    <DialogPageModeContext.Provider
      value={{
        isPageMode: true,
        backHref,
        backLabel,
        pageTitle,
        pageSubtitle,
        badgeText,
        onClosePage,
      }}
    >
      <div className="workspace-page-container animate-in fade-in duration-200">
        {(backHref || onClosePage || pageTitle) && (
          <div className="workspace-header flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {backHref ? (
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs sm:text-sm font-bold transition-colors shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{backLabel}</span>
                </Link>
              ) : onClosePage ? (
                <button
                  type="button"
                  onClick={onClosePage}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs sm:text-sm font-bold transition-colors shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{backLabel}</span>
                </button>
              ) : null}

              {pageTitle && (
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">
                      {pageTitle}
                    </h1>
                    {badgeText && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                        {badgeText}
                      </span>
                    )}
                  </div>
                  {pageSubtitle && (
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      {pageSubtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {children}
      </div>
    </DialogPageModeContext.Provider>
  )
}

function Dialog({
  children,
  open,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const { isPageMode } = useDialogPageMode()
  if (isPageMode) {
    if (open === false) return null
    return <div data-slot="dialog-page-root" className="w-full">{children}</div>
  }
  return (
    <DialogPrimitive.Root data-slot="dialog" open={open} {...props}>
      {children}
    </DialogPrimitive.Root>
  )
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  const { isPageMode } = useDialogPageMode()
  if (isPageMode) {
    return <div {...(props as any)} />
  }
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  const { isPageMode } = useDialogPageMode()
  if (isPageMode) {
    return <>{children}</>
  }
  return (
    <DialogPrimitive.Portal data-slot="dialog-portal" {...props}>
      {children}
    </DialogPrimitive.Portal>
  )
}

function DialogClose({
  children,
  onClick,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  const { isPageMode, onClosePage } = useDialogPageMode()
  if (isPageMode) {
    return (
      <button
        type="button"
        onClick={(e) => {
          onClick?.(e as any)
          onClosePage?.()
        }}
        {...(props as any)}
      >
        {children}
      </button>
    )
  }
  return (
    <DialogPrimitive.Close data-slot="dialog-close" onClick={onClick} {...props}>
      {children}
    </DialogPrimitive.Close>
  )
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  const { isPageMode } = useDialogPageMode()
  if (isPageMode) return null
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function stripModalConstraintClasses(cls?: string) {
  if (!cls) return ""
  return cls
    .replace(/\b(sm:|md:|lg:|xl:|2xl:)?(max-w-|max-h-|w-\[|h-\[)[^\s]+/g, "")
    .replace(/\boverflow-hidden\b/g, "")
    .replace(/\bshadow-2xl\b/g, "")
    .replace(/\bfixed\b/g, "")
    .replace(/\bbottom-0\b/g, "")
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  const { isPageMode } = useDialogPageMode()

  if (isPageMode) {
    return (
      <div
        data-slot="dialog-content-page"
        className={cn(
          "workspace-card w-full max-w-none flex flex-col gap-4 p-4 sm:p-6 lg:p-8",
          stripModalConstraintClasses(className)
        )}
      >
        {children}
      </div>
    )
  }

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-full sm:max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-none sm:rounded-2xl border-y border-x-0 sm:border p-4 sm:p-6 shadow-none sm:shadow-lg duration-200 outline-none sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  const { isPageMode, onClosePage } = useDialogPageMode()
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        isPageMode && "workspace-footer-sticky -mx-4 sm:-mx-6 lg:-mx-8 -mb-4 sm:-mb-6 lg:-mb-8 mt-4",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton &&
        (isPageMode ? (
          <Button type="button" variant="outline" onClick={onClosePage}>
            Batal
          </Button>
        ) : (
          <DialogPrimitive.Close asChild>
            <Button variant="outline">Close</Button>
          </DialogPrimitive.Close>
        ))}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  const { isPageMode } = useDialogPageMode()
  if (isPageMode) {
    return (
      <h2
        data-slot="dialog-title"
        className={cn("text-lg sm:text-xl leading-none font-bold text-slate-900", className)}
        {...(props as any)}
      />
    )
  }
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  const { isPageMode } = useDialogPageMode()
  if (isPageMode) {
    return (
      <p
        data-slot="dialog-description"
        className={cn("text-muted-foreground text-xs sm:text-sm", className)}
        {...(props as any)}
      />
    )
  }
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
