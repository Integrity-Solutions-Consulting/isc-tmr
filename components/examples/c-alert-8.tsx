import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/reui/alert"
import { RiErrorWarningLine } from "@remixicon/react"

export function Pattern() {
  return (
    <Alert variant="destructive">
      <RiErrorWarningLine
      />
      <AlertTitle>Error! Something went wrong</AlertTitle>
      <AlertDescription>
        Please try again. If the problem persists, contact support.
      </AlertDescription>
    </Alert>
  )
}