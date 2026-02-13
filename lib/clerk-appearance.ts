/**
 * Global ClerkProvider appearance — uses CSS variables so Clerk components
 * automatically follow the active theme (arctic, broadsheet, military, zen).
 */
export const clerkProviderAppearance = {
  layout: {
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton",
  },
  variables: {
    colorPrimary: "var(--primary)",
    colorBackground: "var(--background)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorInputBackground: "var(--background)",
    colorInputText: "var(--foreground)",
    borderRadius: "var(--radius)",
    fontFamily: "var(--font-body)",
  },
  elements: {
    rootBox: "w-full max-w-[min(400px,calc(100vw-2rem))]",
    card: "shadow-none border border-border",
    socialButtonsBlockButton:
      "min-h-[44px] border-border font-bold text-[14px]",
    socialButtonsBlockButtonText: "font-bold",
    formButtonPrimary:
      "min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[14px]",
    formFieldInput: "min-h-[44px] border-border text-[16px]",
    headerTitle: "font-black text-foreground",
    headerSubtitle: "text-muted-foreground",
    footerActionLink: "text-primary hover:text-primary/80 font-bold",
    modalBackdrop: "backdrop-blur-sm",
  },
} as const;

/**
 * Shared userProfileProps for UserButton — constrains the modal height
 * and lets it fill its container width.
 */
export const sharedUserProfileProps = {
  appearance: {
    elements: {
      rootBox: "w-full max-w-none",
      card: "max-h-[min(600px,calc(100dvh-4rem))]",
    },
  },
} as const;

/**
 * Popover element overrides so the UserButton dropdown matches the active theme.
 */
export const userButtonPopoverElements = {
  userButtonPopoverCard: "!bg-card !border-border",
  userButtonPopoverActionButton: "!text-foreground",
  userButtonPopoverActionButtonText: "!text-foreground",
  userButtonPopoverActionButtonIcon: "!text-muted-foreground",
  userButtonPopoverFooter: "!hidden",
} as const;
