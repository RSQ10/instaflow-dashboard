import { Link2, Workflow, Rocket, TrendingUp } from "lucide-react";

const steps = [
  { Icon: Link2, title: "Connect Your Account", text: "Link your Instagram or Facebook page in seconds." },
  { Icon: Workflow, title: "Build Your Automation", text: "Create DM flows and auto-replies visually." },
  { Icon: Rocket, title: "Go Live", text: "Start engaging your audience instantly." },
  { Icon: TrendingUp, title: "Scale Effortlessly", text: "Handle thousands of conversations automatically." },
];

export function HowItWorksSection() {
  return (
    <section id="how" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-background/85" aria-hidden />

      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Live in minutes. Automated for life.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Four simple steps to transform your DMs into a sales engine.
          </p>
        </div>

        <ol className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-2xl border border-border bg-card/60 backdrop-blur p-6"
            >
              <div className="flex items-center justify-between">
                <span className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-glow)]">
                  <s.Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-mono text-muted-foreground">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
