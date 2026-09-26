import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";

interface ErrorStepProps {
  message: string;
  actionLabel: string;
  onAction: () => void;
}

export function ErrorStep({ message, actionLabel, onAction }: ErrorStepProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 pb-10 pt-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
        <WarningCircle size={30} weight="fill" />
      </span>
      <p className="text-base font-medium text-foreground">{message}</p>
      <Button onClick={onAction}>{actionLabel}</Button>
    </div>
  );
}
