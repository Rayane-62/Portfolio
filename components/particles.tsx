"use client";

import { useSyncExternalStore } from "react";

type Particle = {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
};

const PARTICLE_COUNT = 32;
const EMPTY: Particle[] = [];

let cached: Particle[] | null = null;

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
    id,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 2 + Math.random() * 3,
    duration: 18 + Math.random() * 14,
    delay: -(Math.random() * 20),
  }));
}

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  if (!cached) cached = generateParticles();
  return cached;
}

function getServerSnapshot() {
  return EMPTY;
}

export function Particles() {
  const particles = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  return (
    <div aria-hidden className="absolute inset-0">
      {particles.map((p) => (
        <span
          key={p.id}
          className="animate-float absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            backgroundColor: "var(--accent)",
            opacity: 0.3,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
