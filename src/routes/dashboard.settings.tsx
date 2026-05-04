import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
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

const RAZORPAY_KEY_ID = "rzp_live_SlIm6fTWPO5ddO";

const INSTAGRAM_APP_ID = "1617505369513918";
const REDIRECT_URI = "https://instaflow-dashboard.vercel.app/auth/instagram/callback";
const SCOPES = [
  "instagram_business_basic",
  "instagram_manage_comments",
  "instagram_business_manage_messages",
].join(",");

function getInstagramAuthUrl(userId: string) {
  const state = encodeURIComponent(userId);
  return (
    `https://www.instagram.com/oauth/authorize` +
    `?force_reauth=true` +
    `&client_id=${INSTAGRAM_APP_ID}` +
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
    price: "₹0",
    amount: 0,
    icon: Sparkles,
    perks: ["1 DM flow", "100 leads / mo", "Basic AI replies"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹399",
    amount: 39900,
    icon: Rocket,
    perks: ["Unlimited flows", "10k leads / mo", "Priority AI", "Comment triggers"],
  },
  {
    id: "scale",
    name: "Scale",
    price: "₹999",
    amount: 99900,
    icon: Crown,
    perks: ["Everything in Pro", "Unlimited leads", "Multi-account", "Dedicated support"],
  },
];

// Load Razorpay script
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("instagram_connected");
    const handle = params.get("handle");
    if (connected === "true" && handle) {
      toast.success(`Instagram @${handle} connected successfully! 🎉`);
      qc.invalidateQueries({ queryKey: ["settings"] });
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

  const payMut = useMutation({
    mutationFn: async (plan: typeof PLANS[number]) => {
      if (!user) throw new Error("Not logged in");

      // 1. Create Razorpay order via Edge Function
      const { data, error } = await supabase.functions.invoke("razorpay-order", {
        body: { action: "create", plan: plan.id, userId: user.id },
      });
      if (error || !data?.orderId) throw new Error(error?.message || "Failed to create order");

      // 2. Load Razorpay checkout
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Failed to load Razorpay. Check your internet connection.");

      // 3. Open Razorpay checkout — returns a promise that resolves on success
      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: "INR",
          name: "Replyloop",
          description: `${plan.name} Plan — ₹${plan.price}/mo`,
          order_id: data.orderId,
          prefill: { email: user.email ?? "" },
          theme: { color: "#7c3aed" },
          handler: async (response: any) => {
            // 4. Verify payment server-side — ONLY switches plan if signature is valid
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              "razorpay-order",
              {
                body: {
                  action: "verify",
                  plan: plan.id,
                  userId: user.id,
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_payment_signature,
                },
              }
            );
            if (verifyError || !verifyData?.success) {
              reject(new Error("Payment verification failed. Contact support."));
              return;
            }
            resolve();
          },
          modal: {
            ondismiss: () => reject(new Error("DISMISSED")),
          },
        });
        rzp.open();
      });
    },
    onSuccess: (_d, plan) => {
      toast.success(`🎉 Upgraded to ${plan.name} plan!`);
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => {
      if (e.message !== "DISMISSED") toast.error(e.message);
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

      {/* Instagram Connection */}
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
                    {disconnectMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Disconnect
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { if (user) window.location.href = getInstagramAuthUrl(user.id); }}
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
                    onClick={() => { if (user) window.location.href = getInstagramAuthUrl(user.id); }}
                    className="bg-gradient-brand text-white shadow-soft hover:opacity-95 gap-2"
                  >
                    <Instagram className="h-4 w-4" />
                    Connect Instagram Account
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    You'll be redirected to Instagram to authorize.
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
        <p className="mt-1 text-sm text-muted-foreground">Upgrade anytime. Payments are secure via Razorpay.</p>
        <div className="mt-5 grid gap-4 perspective-card md:grid-cols-3">
          {PLANS.map((plan) => {
            const active = currentPlan === plan.id;
            const Icon = plan.icon;
            const isPaying = payMut.isPending && (payMut.variables as any)?.id === plan.id;
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
                  {plan.amount > 0 && (
                    <span className="text-sm text-muted-foreground">/mo</span>
                  )}
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
                  disabled={active || payMut.isPending}
                  onClick={() => plan.amount > 0 && payMut.mutate(plan)}
                  className={
                    active
                      ? "mt-5 w-full"
                      : "mt-5 w-full bg-gradient-brand text-white hover:opacity-95"
                  }
                >
                  {isPaying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {active ? "Current plan" : plan.amount === 0 ? "Free plan" : `Upgrade — ${plan.price}`}
                </Button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
