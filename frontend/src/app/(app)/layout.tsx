import { TopNav } from "@/components/ui/TopNav";
import { BottomNav } from "@/components/ui/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <TopNav />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col md:max-w-3xl">{children}</div>
      <BottomNav />
    </div>
  );
}
