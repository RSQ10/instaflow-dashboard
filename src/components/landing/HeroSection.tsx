import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4";

const FADE_MS = 500;

const brands = ["Vortex", "Nimbus", "Prysma", "Cirrus", "Kynder", "Halcyn"];

import { useEffect, useRef } from "react";

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.style.opacity = "0";

    const tick = () => {
      if (!video.duration || isNaN(video.duration)) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const t = video.currentTime;
      const d = video.duration;
      const fade = FADE_MS / 1000;
      let opacity = 1;
      if (t < fade) opacity = t / fade;
      else if (t > d - fade) opacity = Math.max(0, (d - t) / fade);
      video.style.opacity = String(opacity);
      rafRef.current = requestAnimationFrame(tick);
    };

    const onEnded = () => {
      video.style.opacity = "0";
      window.setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => {});
      }, 100);
    };

    video.addEventListener("ended", onEnded);
    video.play().catch(() => {});
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background video */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          src={VIDEO_URL}
          muted
          playsInline
          autoPlay
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0, transition: "none" }}
          aria-hidden
        />
      </div>

      {/* Blurred centered shape */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[984px] h-[527px] opacity-90 bg-gray-950 blur-[82px]"
        aria-hidden
      />

      {/* Foreground */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navbar */}
        <header className="w-full">
          <nav className="flex items-center justify-between py-5 px-8">
            <a href="#" className="flex items-center gap-2">
              <span className="font-display text-foreground text-lg font-semibold tracking-tight">
                InstaFlow
              </span>
            </a>

            <div className="hidden md:flex items-center gap-8">
              <button className="inline-flex items-center gap-1 text-foreground/90 hover:text-foreground transition-colors text-sm">
                Features <ChevronDown className="h-4 w-4" />
              </button>
              <button className="text-foreground/90 hover:text-foreground transition-colors text-sm">
                Solutions
              </button>
              <button className="text-foreground/90 hover:text-foreground transition-colors text-sm">
                Plans
              </button>
              <button className="inline-flex items-center gap-1 text-foreground/90 hover:text-foreground transition-colors text-sm">
                Learning <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <Button variant="heroSecondary" className="rounded-full px-4 py-2 h-auto">
              Sign Up
            </Button>
          </nav>
          <div className="mt-[3px] h-px w-full bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
        </header>

        {/* Hero content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <h1
              className="font-display font-normal leading-[1.02] tracking-[-0.024em] text-foreground"
              style={{ fontSize: "clamp(64px, 16vw, 220px)" }}
            >
              Insta{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(to left, #6366f1, #a855f7, #fcd34d)",
                }}
              >
                Flow
              </span>
            </h1>
            <p
              className="text-lg leading-8 max-w-md mx-auto mt-[9px] opacity-80"
              style={{ color: "var(--hero-sub)" }}
            >
              The most powerful AI ever deployed
              <br />
              in DM automation.
            </p>
            <Button
              variant="heroSecondary"
              className="rounded-full mt-[25px] h-auto"
              style={{ padding: "24px 29px" }}
            >
              Start Free Trial
            </Button>
          </div>
        </div>

        {/* Marquee */}
        <div className="pb-10 px-6">
          <div className="max-w-5xl mx-auto flex items-center gap-12">
            <p className="text-foreground/50 text-sm shrink-0 leading-tight">
              Relied on by brands
              <br />
              across the globe
            </p>
            <div className="flex-1 overflow-hidden">
              <div className="flex gap-16 w-max animate-marquee">
                {[...brands, ...brands].map((name, i) => (
                  <div key={i} className="flex items-center gap-3 shrink-0">
                    <div className="liquid-glass w-6 h-6 rounded-lg grid place-items-center text-foreground text-xs font-semibold">
                      {name[0]}
                    </div>
                    <span className="text-base font-semibold text-foreground whitespace-nowrap">
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
