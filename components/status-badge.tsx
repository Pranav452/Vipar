import { Badge } from "@/components/ui/badge"
import { STATUS_LABEL, type Status } from "@/lib/data"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<Status, string> = {
  sailed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "at-port": "border-foreground/15 bg-foreground/10 text-foreground",
  booked: "border-foreground/10 bg-foreground/[0.04] text-muted-foreground",
  planned: "border-foreground/[0.08] bg-transparent text-muted-foreground/60",
}

const STATUS_DOT: Record<Status, string> = {
  sailed: "bg-emerald-400",
  "at-port": "bg-foreground/70",
  booked: "bg-foreground/40",
  planned: "bg-foreground/20",
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 rounded-full px-2.5 py-0.5 font-medium", STATUS_STYLES[status], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status], status === "sailed" && "animate-pulse")} />
      {STATUS_LABEL[status]}
    </Badge>
  )
}
