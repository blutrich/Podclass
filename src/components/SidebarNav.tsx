import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, GraduationCap, Home, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

interface SidebarNavProps {
  onClose?: () => void;
}

export function SidebarNav({ onClose }: SidebarNavProps) {
  const location = useLocation();

  const navItems = [
    {
      to: "/app",
      icon: Home,
      label: "Home"
    },
    {
      to: "/app/search",
      icon: Search,
      label: "Search"
    },
    {
      to: "/app/university",
      icon: GraduationCap,
      label: "University"
    }
  ];

  return (
    <div className="relative border-r bg-card w-full h-full">
      {/* Close button for mobile */}
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 md:hidden"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <ScrollArea className="h-screen">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-center mb-8 mt-8 md:mt-0">
            <span className="text-xl font-bold">PodClass</span>
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2",
                  location.pathname === item.to && "bg-accent text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </NavLink>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}