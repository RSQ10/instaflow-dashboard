import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { MessageSquareHeart, MessageCircle, Users, Settings, Sparkles, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/dashboard/flows", label: "DM Flows", icon: MessageSquareHeart },
  { to: "/dashboard/triggers", label: "Comment Triggers", icon: MessageCircle },
  { to: "/dashboard/leads", label: "Leads", icon: Users },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <aside className="relative z-10 flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border/60 glass">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-glow animate-float-slow">
          <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-display text-base font-bold leading-none">Replyloop</div>
          <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            Instagram automation
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
                active
                  ? "bg-gradient-brand text-white shadow-glow scale-[1.01]"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground hover:translate-x-0.5",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {item.label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border/60 p-3">
        <div className="flex items-center gap-3 rounded-lg glass px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-sm font-semibold text-white shadow-soft">
            {user?.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user?.email ?? "Guest"}</div>
            <div className="text-xs text-muted-foreground">Free plan</div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
