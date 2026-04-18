import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Replyloop" },
      { name: "description", content: "Sign in to your Replyloop account." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard/flows" });
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 bg-gradient-brand p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2.5 text-white">
          <Sparkles className="h-6 w-6" strokeWidth={2.5} />
          <span className="font-display text-xl font-bold">Replyloop</span>
        </div>
        <div className="text-white">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Reply to every comment.<br />Capture every lead.
          </h2>
          <p className="mt-4 max-w-sm text-white/80">
            AI-powered Instagram automation that feels personal — not spammy.
          </p>
        </div>
        <div className="text-sm text-white/60">© Replyloop · Instagram automation</div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand">
              <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold">Replyloop</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your dashboard</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@brand.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-brand text-white shadow-soft hover:opacity-95"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
