import { useEffect, useState } from "react";
import { MessageCircle, Menu, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const links = [
  { label: "Features", href: "#features" },
  { label: "Automations", href: "#how" },
  { label: "Pricing", href: "#cta" },
  { label: "Docs", href: "#features" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href: string) => {
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "backdrop-blur-xl bg-background/70 border-b border-border shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]"
          : "bg-transparent",
      )}>
      <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-[var(--shadow-glow)]">
            <MessageCircle className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="tracking-tight">SmoothChat</span>
        </a>

        <ul className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {links.map((l) => (
            <li key={l.href}>
              <button
                onClick={() => scrollTo(l.href)}
                className="hover:text-foreground transition-colors">
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-glow px-5 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95 transition-opacity">
            Start Free Trial
          </Link>
        </div>

        <button
          aria-label="Menu"
          className="md:hidden text-foreground p-2"
          onClick={() => setOpen((v) => !v)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <ul className="px-6 py-4 space-y-3 text-sm">
            {links.map((l) => (
              <li key={l.href}>
                <button
                  onClick={() => scrollTo(l.href)}
                  className="block w-full text-left text-muted-foreground hover:text-foreground">
                  {l.label}
                </button>
              </li>
            ))}
            <li>
              <Link
                to="/signup"
                onClick={() => setOpen(false)}
                className="block text-center rounded-full bg-gradient-to-r from-primary to-primary-glow px-4 py-2 text-primary-foreground font-medium">
                Start Free Trial
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
