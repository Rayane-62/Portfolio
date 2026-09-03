"use client";

import { useTheme } from "@/hooks/use-theme";
import { useMounted } from "@/hooks/use-mounted";
import { Particles } from "@/components/particles";

export function AnimatedBackground() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted ? resolvedTheme === "dark" : true;

  if (!isDark) return null;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
      <div className="animate-gradient-flow absolute inset-0 bg-[length:200%_200%] bg-gradient-to-br from-[#0D1B2A] via-[#1a1040] to-[#0D1B2A]" />
      <Particles />
    </div>
  );
}
