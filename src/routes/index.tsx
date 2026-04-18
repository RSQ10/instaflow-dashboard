import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Sparkles, MessageSquareHeart, Users, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Replyloop — Instagram DM & Comment Automation" },
      { name: "description", content: "Turn every comment and DM into a lead. AI-powered Instagram automation that respects your followers." },
      { property: "og:title", content: "Replyloop — Instagram DM & Comment Automation" },
      { property: "og:description", content: "Turn every comment and DM into a lead with AI-powered Instagram automation." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard/flows" });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-glow">
            <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-bold">Replyloop</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild className="bg-gradient-brand text-white shadow-soft hover:opacity-95">
            <Link to="/signup">
              Get started <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <section className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-brand" />
            AI replies that feel human
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Turn Instagram comments into{" "}
            <span className="text-gradient-brand">paying customers</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Automate DMs and comment replies with AI. Gate links behind a follow,
            capture every lead, and grow on autopilot.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" asChild className="bg-gradient-brand text-white shadow-glow hover:opacity-95">
              <Link to="/signup">
                Start free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">I have an account</Link>
            </Button>
          </div>
        </section>

        <section className="mt-24 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: MessageSquareHeart,
              title: "Smart DM flows",
              body: "Trigger replies on any keyword. AI personalizes each message in your voice.",
            },
            {
              icon: Zap,
              title: "Follow-gated links",
              body: "Ask non-followers to follow before you reply. Convert lurkers into fans.",
            },
            {
              icon: Users,
              title: "Lead capture",
              body: "Every interaction becomes a lead with name, handle, and source.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-soft">
                <f.icon className="h-5 w-5 text-foreground" strokeWidth={2} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
