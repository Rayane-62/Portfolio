"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

function subscribeFinePointer(callback: () => void) {
  const mql = window.matchMedia("(pointer: fine)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getFinePointerSnapshot() {
  return window.matchMedia("(pointer: fine)").matches;
}

function getServerFinePointerSnapshot() {
  return false;
}

const HOVER_SELECTOR = "a, button, select, [data-cursor-hover]";

export function CustomCursor() {
  const enabled = useSyncExternalStore(
    subscribeFinePointer,
    getFinePointerSnapshot,
    getServerFinePointerSnapshot
  );
  const [hovering, setHovering] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { damping: 25, stiffness: 300, mass: 0.5 });
  const springY = useSpring(y, { damping: 25, stiffness: 300, mass: 0.5 });

  useEffect(() => {
    if (!enabled) return;

    function handleMove(event: MouseEvent) {
      x.set(event.clientX);
      y.set(event.clientY);
    }

    function handleOver(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      setHovering(!!target?.closest(HOVER_SELECTOR));
    }

    document.documentElement.classList.add("custom-cursor-active");
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseover", handleOver);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseover", handleOver);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[100] rounded-full border-[1.5px]"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
        borderColor: "var(--accent)",
      }}
      animate={{
        width: hovering ? 56 : 20,
        height: hovering ? 56 : 20,
        backgroundColor: hovering
          ? "var(--glass-glow)"
          : "rgba(6, 182, 212, 0.12)",
      }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    />
  );
}
