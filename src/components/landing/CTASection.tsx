import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CTASection() {
  return (
    <section id="cta" className="relative py-28">
      <div className="mx-auto max-w-4xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-secondary p-10 sm:p-16 text-center">
          <div
            className="absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[40rem] rounded-full opacity-40 blur-3xl"
            style={{ background: "var(--gradient-primary)" }}
            aria-hidden
          />
          <h2 className="relative text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Start automating your conversations today.
          </h2>
          <p className="relative mt-4 text-muted-foreground max-w-xl mx-auto">
            No code. No complexity. Just results.
          </p>
          <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-glow px-8 py-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95 transition-all hover:-translate-y-0.5">
              Start Free Trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <span className="text-xs text-muted-foreground">
              14-day free trial · No credit card required
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
