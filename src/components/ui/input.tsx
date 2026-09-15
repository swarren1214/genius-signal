import * as React from "react"
import { VegaInput } from "@/components/vega-components"
import { cn } from "cn"

function Input({ className, type, size: _size, ...props }: React.ComponentProps<"input">) {
  const vegaProps = props as unknown as React.ComponentProps<typeof VegaInput>

  return (
    <VegaInput
      type={type as "text" | "email" | "password" | "number" | "hidden" | undefined}
      data-slot="input"
      className={cn(
        "w-full min-w-0",
        className
      )}
      {...vegaProps}
    />
  )
}

export { Input }
