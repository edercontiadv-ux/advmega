import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-zinc-100 text-zinc-900 shadow hover:bg-zinc-100/80",
        secondary:
          "border-transparent bg-zinc-800 text-zinc-50 hover:bg-zinc-800/80",
        destructive:
          "border-transparent bg-red-900 text-zinc-50 hover:bg-red-900/80",
        outline: "text-zinc-50 border-zinc-800",
        unread: "border-transparent bg-blue-600 text-white shadow hover:bg-blue-700",
        read: "border-transparent bg-zinc-800 text-zinc-400 hover:bg-zinc-800/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
