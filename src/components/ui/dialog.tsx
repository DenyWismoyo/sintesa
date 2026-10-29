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
          <div className="workspace-header flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {backHref ? (
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{backLabel}</span>
                </Link>
              ) : onClosePage ? (
                <button
                  type="button"
                  onClick={onClosePage}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{backLabel}</span>
                </button>
              ) : null}

              {pageTitle && (
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 tracking-tight truncate">
                      {pageTitle}
                    </h1>
                    {badgeText && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                        {badgeText}
                      </span>
                    )}
                  </div>
                  {pageSubtitle && (
                    <p className="text-[11px] sm:text-xs text-slate-500 font-normal truncate mt-0.5">
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
          "workspace-card w-full max-w-4xl mx-auto flex flex-col gap-3.5 p-3.5 sm:p-5 md:p-6",
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
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-1.5rem)] sm:max-w-lg md:max-w-xl translate-x-[-50%] translate-y-[-50%] gap-3.5 rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xl duration-200 outline-none max-h-[92vh] overflow-y-auto custom-scrollbar",
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
      className={cn("flex flex-col gap-1 text-left pb-2.5 border-b border-slate-100", className)}
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
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2",
        isPageMode && "workspace-footer-sticky -mx-3.5 sm:-mx-5 md:-mx-6 -mb-3.5 sm:-mb-5 md:-mb-6 mt-3",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton &&
        (isPageMode ? (
          <Button type="button" variant="outline" size="sm" onClick={onClosePage} className="h-8.5 text-xs font-semibold">
            Batal
          </Button>
        ) : (
          <DialogPrimitive.Close asChild>
            <Button variant="outline" size="sm" className="h-8.5 text-xs font-semibold">Batal</Button>
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
        className={cn("text-base sm:text-lg leading-tight font-bold text-slate-900 tracking-tight", className)}
        {...(props as any)}
      />
    )
  }
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base sm:text-lg leading-tight font-bold text-slate-900 tracking-tight", className)}
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
        className={cn("text-slate-500 text-xs sm:text-sm font-normal leading-relaxed", className)}
        {...(props as any)}
      />
    )
  }
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-slate-500 text-xs sm:text-sm font-normal leading-relaxed", className)}
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
