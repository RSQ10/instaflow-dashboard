import { MessageSquare, Filter, Megaphone, MousePointerClick, Bot, BarChart3 } from "lucide-react";

const features = [
  { Icon: MessageSquare, title: "Auto-Reply to DMs", text: "Instantly respond to every message, 24/7, without missing a lead." },
  { Icon: Filter, title: "Lead Capture Funnels", text: "Turn conversations into qualified leads with guided flows." },
  { Icon: Megaphone, title: "Broadcast Campaigns", text: "Send targeted messages to your entire audience in one click." },
  { Icon: MousePointerClick, title: "No-Code Builder", text: "Design powerful automations visually — no coding required." },
  { Icon: Bot, title: "AI Smart Replies", text: "Human-like automated responses powered by advanced AI." },
  { Icon: BarChart3, title: "Analytics Dashboard", text: "Track performance, conversions, and growth in real time." },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-background/90" aria-hidden />

      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Everything you need to convert chats into revenue.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Built for creators, e-commerce brands, and agencies that live in the DMs.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card/60 backdrop-blur p-6 transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 hover:shadow-[var(--shadow-glow)]"
            >
              <span className="grid place-items-center h-11 w-11 rounded-xl bg-secondary text-primary-glow group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-primary-glow group-hover:text-primary-foreground transition-all">
                <f.Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
