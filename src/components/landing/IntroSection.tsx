import { Instagram, Facebook, MessageCircle, Send } from "lucide-react";

const platforms = [
  { name: "Instagram", Icon: Instagram },
  { name: "Facebook", Icon: Facebook },
  { name: "Messenger", Icon: MessageCircle },
  { name: "WhatsApp", Icon: Send },
];

export function IntroSection() {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-background/80" aria-hidden />

      <div className="mx-auto max-w-5xl px-6 text-center">
        <span className="inline-flex items-center rounded-full border border-border bg-card/40 backdrop-blur px-4 py-1.5 text-xs text-muted-foreground">
          Trusted by creators & brands
        </span>

        <h2 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
          Conversations that convert into customers.
        </h2>

        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          InstaFlow helps you automate replies, capture leads, and turn every message into an
          opportunity.
        </p>

        <ul className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {platforms.map(({ name, Icon }) => (
            <li
              key={name}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 backdrop-blur px-4 py-2 text-sm text-foreground"
            >
              <Icon className="h-4 w-4 text-primary-glow" />
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
