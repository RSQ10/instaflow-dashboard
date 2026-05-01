import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Instagram, Loader2, Check, Sparkles, Crown, Rocket, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

type Settings = {
  user_id: string;
  instagram_handle: string | null;
  instagram_connected: boolean;
  instagram_user_id: string | null;
  subscription_plan: string;
};

const META_APP_ID = "1015148554407217";
const REDIRECT_URI = "https://instaflow-dashboard.vercel.app/auth/instagram/callback";
const SCOPES = [
  "instagram_basic",
  "instagram_manage_comments",
  "instagram_manage_messages",
].join(",");

function getInstagramAuthUrl(userId: string) {
  const state = encodeURIComponent(userId);
  return (
    `https://api.instagram.com/oauth/authorize` +
    `?client_id=${META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${SCOPES}` +
    `&response_type=code` +
    `&state=${state}`
  );
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    icon: Sparkles,
    perks: ["1 DM flow", "100 leads / mo", "Basic AI replies"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    icon: Rocket,
    perks: ["Unlimited flows", "10k leads / mo", "Priority AI", "Comment triggers"],
  },
  {
    id: "scale",
    name: "Scale",
    price: "$99",
    icon: Crown,
    perks: ["Everything in Pro", "Unlimited leads", "Multi-account", "Dedicated support"],
  },
];

function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Settings | null;
    },
    enabled: !!user,
  });

  // Check if we're returning from Instagram OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("instagram_connected");
    const handle = params.get("handle");
    if (connected === "true" && handle) {
      toast.success(`Instagram @${handle} connected successfully! 🎉`);
      qc.invalidateQueries({ queryKey: ["settings"] });
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const disconnectMut = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("user_settings")
        .update({
          instagram_connected: false,
          instagram_handle: null,
          instagram_user_id: null,
          instagram_access_token: null,
        })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Instagram disconnected");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => toast.error("Failed to disconnect"),
  });

  const planMut = useMutation({
    mutationFn: async (plan: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, subscription_plan: plan }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: (_d, plan) => {
      toast.success(`Switched to ${plan} plan`);
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentPlan = settings?.subscription_plan ?? "free";
  const isConnected = settings?.instagram_connected && settings?.instagram_handle;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your Instagram connection and plan.
      </p>

      {/* Instagram Connection Section */}
      <section className="mt-8 glass rounded-2xl border border-border p-6 shadow-soft animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-brand">
            <Instagram className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold">Instagram account</h2>
              {isConnected && (
                <Badge className="bg-gradient-brand text-white hover:opacity-95">
                  <Check className="mr-1 h-3 w-3" /> Connected
                </Badge>
              )}
            </div>

            {isConnected ? (
              <>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connected as{" "}
                  <a
                    href={`https://instagram.com/${settings.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    @{settings.instagram_handle}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => disconnectMut.mutate()}
                    disabled={disconnectMut.isPending}
                  >
                    {disconnectMut.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Disconnect
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (user) window.location.href = getInstagramAuthUrl(user.id);
                    }}
                  >
                    Reconnect
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-muted-foreground">
                  Link your Instagram Business account to start automating DMs and comments.
                </p>
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      if (user) window.location.href = getInstagramAuthUrl(user.id);
                    }}
                    className="bg-gradient-brand text-white shadow-soft hover:opacity-95 gap-2"
                  >
                    <Instagram className="h-4 w-4" />
                    Connect Instagram Account
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    You'll be redirected to Instagram to authorize SmoothChat.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Subscription plan</h2>
        <p className="mt-1 text-sm text-muted-foreground">Upgrade anytime, cancel anytime.</p>
        <div className="mt-5 grid gap-4 perspective-card md:grid-cols-3">
          {PLANS.map((plan) => {
            const active = currentPlan === plan.id;
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={[
                  "tilt-3d rounded-2xl border p-6 shadow-soft animate-fade-in-up",
                  active
                    ? "border-primary/40 bg-gradient-soft ring-2 ring-primary/30 shadow-glow"
                    : "glass border-border",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand">
                    <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  {active && (
                    <Badge className="bg-foreground text-background hover:bg-foreground/90">
                      Current
                    </Badge>
                  )}
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
                  className={
                    active
                      ? "mt-5 w-full"
                      : "mt-5 w-full bg-gradient-brand text-white hover:opacity-95"
                  }
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
