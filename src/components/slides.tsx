import React from "react";
import { WrappedSummary } from "@/types/wrapped";
import { SlideContainer, AnimatedNumber } from "@/components/ui-wrapped";

// ─── 1. Intro ─────────────────────────────────────────────────────────────────

export const IntroSlide = ({
  isActive,
  displayName,
  year,
  avatarUrl,
}: {
  isActive: boolean;
  displayName: string;
  year: number;
  avatarUrl: string | null;
}) => (
  <SlideContainer isActive={isActive}>
    <div className="text-center space-y-6">
      {avatarUrl && (
        <div
          className={`inline-block transition-all duration-700 delay-200 ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
        >
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-20 h-20 rounded-2xl mx-auto ring-2 ring-primary/30 shadow-glow-gold"
          />
        </div>
      )}

      <div
        className={`transition-all duration-700 delay-300 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <span className="text-xs font-semibold tracking-[0.25em] uppercase text-primary">
          Mesa de Servicios · BPN
        </span>
      </div>

      <h1
        className={`font-display text-6xl md:text-8xl font-extrabold leading-none transition-all duration-700 delay-500 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <span className="text-gradient-gold">Tu</span>
        <br />
        <span className="text-foreground">Wrapped</span>
        <br />
        <span className="text-gradient-gold">{year}</span>
      </h1>

      <p
        className={`text-xl text-muted-foreground transition-all duration-700 delay-700 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        Hola, <span className="text-foreground font-semibold">{displayName}</span>
      </p>

      <div
        className={`pt-4 transition-all duration-700 delay-1000 ${isActive ? "opacity-100" : "opacity-0"}`}
      >
        <div className="inline-flex items-center gap-2 text-muted-foreground/60 text-sm">
          <span>Tocá para continuar</span>
          <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </div>
  </SlideContainer>
);

// ─── 2. Volumen ───────────────────────────────────────────────────────────────

export const VolumeSlide = ({
  isActive,
  totalIssues,
  resolvedIssues,
  avgPerMonth,
}: {
  isActive: boolean;
  totalIssues: number;
  resolvedIssues: number;
  avgPerMonth: number;
}) => {
  const resolvedPct = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

  return (
    <SlideContainer isActive={isActive}>
      <div className="space-y-6">
        <div className={`transition-all duration-700 delay-100 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-primary">
            Tu volumen
          </span>
        </div>

        <div className={`transition-all duration-700 delay-300 ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-glow-gold blur-3xl" />
            <p className="font-display text-[10rem] md:text-[14rem] font-extrabold leading-none text-gradient-gold relative">
              {isActive && <AnimatedNumber value={totalIssues} duration={2000} />}
            </p>
          </div>
          <p className="text-2xl md:text-3xl text-muted-foreground font-medium -mt-4">
            tickets creaste este año
          </p>
        </div>

        <div className={`grid grid-cols-2 gap-4 pt-4 transition-all duration-700 delay-700 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="bg-gradient-card rounded-2xl p-5 border border-border/50">
            <p className="font-display text-4xl font-bold text-foreground">
              {isActive && <AnimatedNumber value={resolvedPct} duration={1500} suffix="%" />}
            </p>
            <p className="text-muted-foreground text-sm mt-1">resueltos</p>
          </div>
          <div className="bg-gradient-card rounded-2xl p-5 border border-border/50">
            <p className="font-display text-4xl font-bold text-foreground">
              {isActive && <AnimatedNumber value={avgPerMonth} duration={1500} />}
            </p>
            <p className="text-muted-foreground text-sm mt-1">tickets/mes promedio</p>
          </div>
        </div>
      </div>
    </SlideContainer>
  );
};

// ─── 3. Tipos de solicitud ────────────────────────────────────────────────────

export const TypesSlide = ({
  isActive,
  topRequestTypes,
}: {
  isActive: boolean;
  topRequestTypes: WrappedSummary["top_request_types"];
}) => {
  const max = Math.max(...topRequestTypes.map((t) => t.count));

  return (
    <SlideContainer isActive={isActive}>
      <div className="space-y-6">
        <div className={`transition-all duration-700 delay-100 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-primary">
            Lo que más pediste
          </span>
        </div>

        <div className={`transition-all duration-700 delay-300 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
            Tu solicitud{" "}
            <span className="text-gradient-gold">favorita</span>
          </h2>
          <p className="text-xl text-gradient-green font-semibold mt-2">
            {topRequestTypes[0]?.type || "—"}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {topRequestTypes.map((item, i) => (
            <div
              key={item.type}
              className="flex items-center gap-4 transition-all duration-500"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? "translateX(0)" : "translateX(-24px)",
                transitionDelay: `${500 + i * 120}ms`,
              }}
            >
              <span className="font-display text-3xl font-extrabold text-muted-foreground/30 w-8 text-right">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-foreground text-sm font-medium">{item.type}</span>
                  <span className="text-primary text-sm font-bold">{item.count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-hero rounded-full transition-all duration-1000"
                    style={{
                      width: isActive ? `${(item.count / max) * 100}%` : "0%",
                      transitionDelay: `${700 + i * 120}ms`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideContainer>
  );
};

// ─── 4. Proyectos ─────────────────────────────────────────────────────────────

export const ProjectsSlide = ({
  isActive,
  topProjects,
}: {
  isActive: boolean;
  topProjects: WrappedSummary["top_projects"];
}) => {
  const colors = ["text-gradient-gold", "text-gradient-green", "text-foreground"];

  return (
    <SlideContainer isActive={isActive}>
      <div className="space-y-6">
        <div className={`transition-all duration-700 delay-100 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-primary">
            Tus proyectos
          </span>
        </div>

        <div className={`transition-all duration-700 delay-300 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-foreground">
            Donde más<br />
            <span className="text-gradient-gold">generaste tickets</span>
          </h2>
        </div>

        <div className="space-y-4 pt-4">
          {topProjects.map((item, i) => (
            <div
              key={item.project}
              className="flex items-center gap-6 bg-gradient-card rounded-2xl p-5 border border-border/50 transition-all duration-700"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? "translateY(0)" : "translateY(20px)",
                transitionDelay: `${500 + i * 150}ms`,
              }}
            >
              <span className={`font-display text-5xl font-extrabold ${colors[i]}`}>
                #{i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-semibold truncate">{item.project}</p>
                <p className="text-muted-foreground text-sm">{item.count} tickets</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideContainer>
  );
};

// ─── 5. Ritmo mensual ─────────────────────────────────────────────────────────

export const RhythmSlide = ({
  isActive,
  peakMonth,
  peakWeekday,
  monthlyBreakdown,
}: {
  isActive: boolean;
  peakMonth: string;
  peakWeekday: string;
  monthlyBreakdown: WrappedSummary["monthly_breakdown"];
}) => {
  const max = Math.max(...monthlyBreakdown.map((m) => m.count), 1);

  return (
    <SlideContainer isActive={isActive}>
      <div className="space-y-6">
        <div className={`transition-all duration-700 delay-100 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-primary">
            Tu ritmo
          </span>
        </div>

        <div className={`transition-all duration-700 delay-300 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground">
            Tu mes pico fue
          </h2>
          <p className="font-display text-6xl md:text-8xl font-extrabold text-gradient-gold mt-1">
            {peakMonth}
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            El día que más usás el service desk:{" "}
            <span className="text-foreground font-semibold">{peakWeekday}</span>
          </p>
        </div>

        {/* Barras de actividad */}
        <div className={`pt-2 transition-all duration-700 delay-500 ${isActive ? "opacity-100" : "opacity-0"}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Actividad mensual</p>
          <div className="flex items-end gap-1 h-24">
            {monthlyBreakdown.map((m, i) => (
              <div key={m.month} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-full rounded-t-md transition-all duration-700 ${
                    m.month === peakMonth
                      ? "bg-gradient-hero shadow-glow-gold"
                      : "bg-muted"
                  }`}
                  style={{
                    height: isActive ? `${Math.max((m.count / max) * 100, m.count > 0 ? 8 : 4)}%` : "4%",
                    transitionDelay: `${600 + i * 40}ms`,
                  }}
                />
                <span className="text-[9px] text-muted-foreground">
                  {m.month.substring(0, 3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideContainer>
  );
};

// ─── 6. Eficiencia ────────────────────────────────────────────────────────────

export const EfficiencySlide = ({
  isActive,
  avgResolutionHours,
  firstContactRate,
}: {
  isActive: boolean;
  avgResolutionHours: number;
  firstContactRate: number;
}) => (
  <SlideContainer isActive={isActive}>
    <div className="space-y-6">
      <div className={`transition-all duration-700 delay-100 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <span className="text-xs font-semibold tracking-[0.25em] uppercase text-primary">
          Qué tan rápido
        </span>
      </div>

      <div className={`transition-all duration-700 delay-300 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <h2 className="font-display text-4xl md:text-5xl font-extrabold text-foreground">
          Así de rápido<br />
          <span className="text-gradient-green">resolvimos tus tickets</span>
        </h2>
      </div>

      <div className={`grid grid-cols-2 gap-4 pt-4 transition-all duration-700 delay-500 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="bg-gradient-card rounded-2xl p-6 border border-border/50 text-center">
          <p className="font-display text-5xl md:text-6xl font-extrabold text-gradient-gold">
            {isActive && <AnimatedNumber value={avgResolutionHours} decimals={1} suffix="h" duration={1800} />}
          </p>
          <p className="text-muted-foreground text-sm mt-3 leading-snug">
            tiempo promedio<br />de resolución
          </p>
        </div>
        <div className="bg-gradient-card rounded-2xl p-6 border border-border/50 text-center">
          <p className="font-display text-5xl md:text-6xl font-extrabold text-gradient-green">
            {isActive && <AnimatedNumber value={firstContactRate} suffix="%" duration={1800} />}
          </p>
          <p className="text-muted-foreground text-sm mt-3 leading-snug">
            resueltos<br />en menos de 4h
          </p>
        </div>
      </div>

      <p className={`text-muted-foreground/60 text-sm text-center transition-all duration-700 delay-700 ${isActive ? "opacity-100" : "opacity-0"}`}>
        Nuestro equipo trabajó para darte la mejor experiencia
      </p>
    </div>
  </SlideContainer>
);

// ─── 7. Cierre ────────────────────────────────────────────────────────────────

export const ClosingSlide = ({
  isActive,
  displayName,
  year,
  onRestart,
}: {
  isActive: boolean;
  displayName: string;
  year: number;
  onRestart: () => void;
}) => (
  <SlideContainer isActive={isActive}>
    <div className="text-center space-y-6">
      <div className={`transition-all duration-700 delay-200 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <span className="text-xs font-semibold tracking-[0.25em] uppercase text-primary">
          Hasta el año que viene
        </span>
      </div>

      <div className={`transition-all duration-700 delay-400 ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
        <h2 className="font-display text-5xl md:text-7xl font-extrabold text-foreground leading-tight">
          ¡Gracias<br />
          <span className="text-gradient-gold">{displayName}</span>!
        </h2>
      </div>

      <p className={`text-lg text-muted-foreground transition-all duration-700 delay-600 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        Fue un placer acompañarte durante {year}.<br />
        Seguimos acá para lo que necesites.
      </p>

      <div className={`flex flex-col items-center gap-3 pt-6 transition-all duration-700 delay-800 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <button
          onClick={onRestart}
          className="px-8 py-3 rounded-full bg-gradient-hero text-background font-semibold text-sm shadow-glow-gold hover:opacity-90 active:scale-95 transition-all"
        >
          Ver de nuevo
        </button>
        <p className="text-muted-foreground/40 text-xs">
          BPN Wrapped {year} · Mesa de Servicios
        </p>
      </div>
    </div>
  </SlideContainer>
);
