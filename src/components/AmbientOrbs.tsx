/**
 * Decorative animated gradient orbs for backgrounds.
 * Pure CSS — no libs. Pointer-events disabled so they never block UI.
 */
type Variant = "landing" | "auth" | "subtle";

export function AmbientOrbs({ variant = "subtle" }: { variant?: Variant }) {
  if (variant === "landing") {
    return (
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="gradient-orb animate-orb-1"
          style={{
            width: 520,
            height: 520,
            top: -120,
            left: -100,
            background:
              "radial-gradient(circle, oklch(0.82 0.17 80 / 0.7), transparent 70%)",
          }}
        />
        <div
          className="gradient-orb animate-orb-2"
          style={{
            width: 600,
            height: 600,
            top: 80,
            right: -160,
            background:
              "radial-gradient(circle, oklch(0.55 0.27 340 / 0.55), transparent 70%)",
          }}
        />
        <div
          className="gradient-orb animate-orb-3"
          style={{
            width: 480,
            height: 480,
            bottom: -160,
            left: "30%",
            background:
              "radial-gradient(circle, oklch(0.72 0.2 45 / 0.45), transparent 70%)",
          }}
        />
      </div>
    );
  }

  if (variant === "auth") {
    return (
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="gradient-orb animate-orb-1"
          style={{
            width: 460,
            height: 460,
            top: -120,
            right: -120,
            background:
              "radial-gradient(circle, oklch(0.65 0.24 5 / 0.55), transparent 70%)",
          }}
        />
        <div
          className="gradient-orb animate-orb-2"
          style={{
            width: 520,
            height: 520,
            bottom: -160,
            left: -140,
            background:
              "radial-gradient(circle, oklch(0.82 0.17 80 / 0.55), transparent 70%)",
          }}
        />
      </div>
    );
  }

  // subtle (dashboard backgrounds)
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="gradient-orb animate-orb-1"
        style={{
          width: 380,
          height: 380,
          top: -120,
          right: -100,
          opacity: 0.3,
          background:
            "radial-gradient(circle, oklch(0.72 0.2 45 / 0.5), transparent 70%)",
        }}
      />
      <div
        className="gradient-orb animate-orb-3"
        style={{
          width: 420,
          height: 420,
          bottom: -180,
          left: -120,
          opacity: 0.25,
          background:
            "radial-gradient(circle, oklch(0.55 0.27 340 / 0.5), transparent 70%)",
        }}
      />
    </div>
  );
}
