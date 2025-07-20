import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ChartContainerProps {
  children: ReactNode
  className?: string
  config?: Record<string, any>
}

export function ChartContainer({ children, className, config, ...props }: ChartContainerProps) {
  return (
    <div className={cn("flex aspect-video justify-center text-xs", className)} {...props}>
      {children}
    </div>
  )
}

export function ChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <div className="grid grid-cols-2 gap-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                {entry.name}
              </span>
              <span className="font-bold text-muted-foreground">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function ChartTooltipContent(props: any) {
  return <ChartTooltip {...props} />
}