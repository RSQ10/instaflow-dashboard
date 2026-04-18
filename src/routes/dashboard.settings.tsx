import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Instagram, Loader2, Check, Sparkles, Crown, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

type Settings = {
  user_id: string;
  instagram_handle: string | null;
  instagram_connected: boolean;
  subscription_plan: string;
};

const PLANS = [
  { id: "free", name: "Free", price: "$0", icon: Sparkles, perks: ["1 DM flow", "100 leads / mo", "Basic AI replies"] },
  { id: "pro", name: "Pro", price: "$29", icon: Rocket, perks: ["Unlimited flows", "10k leads / mo", "Priority AI", "Comment triggers"] },
  { id: "scale", name: "Scale", price: "$99", icon: Crown, perks: ["Everything in Pro", "Unlimited leads", "Multi-account", "Dedicated support"] },
];

function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [handle, setHandle] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data as Settings | null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (settings?.instagram_handle) setHandle(settings.instagram_handle);
  }, [settings]);

  const upsert = async (patch: Partial<Settings>) => {
    if (!user) return;
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });
    if (error) throw error;
  };

  const connectMut = useMutation({
    mutationFn: async () => {
      const clean = handle.trim().replace(/^@/, "");
      if (!clean) throw new Error("Enter your Instagram handle");
      await upsert({ instagram_handle: clean, instagram_connected: true });
    },
    onSuccess: () => {
      toast.success("Instagram connected");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const disconnectMut = useMutation({
    mutationFn: async () => {
      await upsert({ instagram_connected: false });
    },
    onSuccess: () => {
      toast.success("Instagram disconnected");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const planMut = useMutation({
    mutationFn: async (plan: string) => {
      await upsert({ subscription_plan: plan });
    },
    onSuccess: (_d, plan) => {
      toast.success(`Switched to ${plan} plan`);
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    );
  }

  const currentPlan = settings?.subscription_plan ?? "free";

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your Instagram connection and plan.</p>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-brand">
            <Instagram className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold">Instagram account</h2>
              {settings?.instagram_connected && (
                <Badge className="bg-gradient-brand text-white hover:opacity-95">
                  <Check className="mr-1 h-3 w-3" /> Connected
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {settings?.instagram_connected
                ? `Connected as @${settings.instagram_handle}`
                : "Link your Instagram business account to start automating."}
            </p>

            <div className="mt-4 flex max-w-md gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                <Input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))}
                  placeholder="yourbrand"
                  className="pl-7"
                  disabled={settings?.instagram_connected}
                />
              </div>
              {settings?.instagram_connected ? (
                <Button variant="outline" onClick={() => disconnectMut.mutate()} disabled={disconnectMut.isPending}>
                  Disconnect
                </Button>
              ) : (
                <Button
                  onClick={() => connectMut.mutate()}
                  disabled={connectMut.isPending}
                  className="bg-gradient-brand text-white shadow-soft hover:opacity-95"
                >
                  {connectMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Connect
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Subscription plan</h2>
        <p className="mt-1 text-sm text-muted-foreground">Upgrade anytime, cancel anytime.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const active = currentPlan === plan.id;
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={[
                  "rounded-2xl border p-6 shadow-soft transition-all",
                  active
                    ? "border-primary/30 bg-gradient-soft ring-2 ring-primary/30"
                    : "border-border bg-card",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand">
                    <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  {active && <Badge className="bg-foreground text-background hover:bg-foreground/90">Current</Badge>}
                </div>
                <h3 className="mt-4 font-display text-xl font-bold">{plan.name}</h3>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={active ? "outline" : "default"}
                  disabled={active || planMut.isPending}
                  onClick={() => planMut.mutate(plan.id)}
                  className={active ? "mt-5 w-full" : "mt-5 w-full bg-gradient-brand text-white hover:opacity-95"}
                >
                  {active ? "Current plan" : `Switch to ${plan.name}`}
                </Button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
