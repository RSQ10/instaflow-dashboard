import { MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <a href="#" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow">
            <MessageCircle className="h-4 w-4 text-primary-foreground" />
          </span>
          SmoothChat
        </a>
        <ul className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
          <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
          <li><a href="#docs" className="hover:text-foreground transition-colors">Docs</a></li>
          <li><a href="#contact" className="hover:text-foreground transition-colors">Contact</a></li>
        </ul>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} SmoothChat. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
