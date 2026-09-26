import type { HTMLAttributes } from "react";

export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-control bg-surface-elevated ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}
