// ─── LoadingScreen ────────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const LoadingScreen = () => {
  const messages = [
    "Conectando con Jira…",
    "Buscando tus tickets…",
    "Calculando métricas…",
    "Preparando tu Wrapped…",
  ];
  const [msg, setMsg] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setMsg((m) => (m + 1) % messages.length), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-8">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-glow-gold animate-pulse">
          <svg className="w-10 h-10 text-background" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.005 1.005 0 0 0-1.001-1.005zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24.013 12.487V1.005A1.005 1.005 0 0 0 23.013 0z"/>
          </svg>
        </div>
      </div>
      <p className="text-muted-foreground text-sm animate-pulse">{messages[msg]}</p>
    </div>
  );
};

// ─── AnimatedNumber ───────────────────────────────────────────────────────────

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}

export const AnimatedNumber = ({
  value,
  duration = 1800,
  suffix = "",
  decimals = 0,
}: AnimatedNumberProps) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start: number;
    let raf: number;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(eased * value);
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className="tabular-nums">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
};

// ─── SlideContainer ───────────────────────────────────────────────────────────

interface SlideContainerProps {
  children: React.ReactNode;
  isActive: boolean;
  className?: string;
}

export const SlideContainer = ({ children, isActive, className }: SlideContainerProps) => (
  <div
    className={cn(
      "absolute inset-0 flex flex-col items-center justify-center px-6 md:px-16 transition-all duration-700",
      isActive ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-8 pointer-events-none",
      className
    )}
  >
    <div className="w-full max-w-3xl mx-auto">{children}</div>
  </div>
);

// ─── ProgressIndicator ────────────────────────────────────────────────────────

interface ProgressIndicatorProps {
  total: number;
  current: number;
  onGoTo?: (i: number) => void;
}

export const ProgressIndicator = ({ total, current, onGoTo }: ProgressIndicatorProps) => (
  <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex gap-1.5">
    {Array.from({ length: total }).map((_, i) => (
      <button
        key={i}
        onClick={() => onGoTo?.(i)}
        className={cn(
          "h-1 rounded-full transition-all duration-500",
          i === current
            ? "bg-primary w-8"
            : i < current
            ? "bg-primary/40 w-4"
            : "bg-muted w-4"
        )}
      />
    ))}
  </div>
);
