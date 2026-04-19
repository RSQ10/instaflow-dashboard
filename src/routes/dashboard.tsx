import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AppSidebar } from "@/components/AppSidebar";
import { AmbientOrbs } from "@/components/AmbientOrbs";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background">
      <AmbientOrbs variant="subtle" />
      <AppSidebar />
      <main className="relative flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8 animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
