import { cn } from "cn"
import { RiLoaderLine } from "@remixicon/react"

// Props del icono (RemixiconProps no admite children, a diferencia de <svg>)
function Spinner({ className, ...props }: React.ComponentProps<typeof RiLoaderLine>) {
  return (
    <RiLoaderLine data-slot="spinner" role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
