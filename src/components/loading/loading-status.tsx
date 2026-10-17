import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
export function LoadingStatus({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("loading-status", className)}
    >
      <Spinner aria-hidden="true" role={undefined} aria-label={undefined} />
      <span>{label}</span>
    </div>
  );
}
