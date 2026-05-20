"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { EarnedLoadingText } from "@/components/earned/loading-text"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <EarnedLoadingText dotsOnly label="loading" />,
      }}
      // On mobile, push toasts above the floating bottom-nav pill so they
      // are never hidden behind it. Desktop keeps Sonner's default offsets.
      // `--bottom-nav-gap` already accounts for nav height + offset + safe-area.
      mobileOffset={{
        bottom: "calc(var(--bottom-nav-gap, 6rem) + 0.5rem)",
        left: "1rem",
        right: "1rem",
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
