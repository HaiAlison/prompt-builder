import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function EmployeeAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  );
}
