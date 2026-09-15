"use client"

import { VegaDivider } from "@/components/vega-components"
import { cn } from "cn"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: Omit<React.ComponentProps<typeof VegaDivider>, "direction"> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <VegaDivider
      data-slot="separator"
      direction={orientation}
      className={cn(
        "shrink-0",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
