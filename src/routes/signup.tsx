import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Replyloop" },
      { name: "description", content: "Create your Replyloop account and start automating Instagram." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard/flows` },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — you're in!");
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
            Start free.<br />Grow on autopilot.
          </h2>
          <p className="mt-4 max-w-sm text-white/80">
            Set up your first DM flow in under 2 minutes.
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
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Free forever — no credit card</p>

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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-brand text-white shadow-soft hover:opacity-95"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
