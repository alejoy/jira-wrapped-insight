import React, { useState, useCallback, useEffect } from "react";
import { WrappedSummary } from "@/types/wrapped";
import { ProgressIndicator } from "@/components/ui-wrapped";
import {
  IntroSlide,
  VolumeSlide,
  TypesSlide,
  ProjectsSlide,
  RhythmSlide,
  EfficiencySlide,
  ClosingSlide,
} from "@/components/slides";

const TOTAL = 7;

export const WrappedPresentation = ({
  data,
}: {
  data: WrappedSummary;
}) => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => Math.min(c + 1, TOTAL - 1)), []);
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);
  const restart = useCallback(() => setCurrent(0), []);

  // Navegación con teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  // Tap: mitad derecha avanza, mitad izquierda retrocede
  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientX - rect.left > rect.width / 2) next(); else prev();
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-background cursor-pointer grain select-none"
      onClick={handleClick}
    >
      {/* Orbes de fondo */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-glow-gold blur-3xl pointer-events-none opacity-60" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-glow-green blur-3xl pointer-events-none opacity-40" />

      {/* Progress */}
      <ProgressIndicator total={TOTAL} current={current} onGoTo={setCurrent} />

      {/* Slides */}
      <IntroSlide
        isActive={current === 0}
        displayName={data.user.displayName}
        year={data.year}
        avatarUrl={data.user.avatarUrl}
      />
      <VolumeSlide
        isActive={current === 1}
        totalIssues={data.total_issues}
        resolvedIssues={data.resolved_issues}
        avgPerMonth={data.avg_per_month}
      />
      <TypesSlide
        isActive={current === 2}
        topRequestTypes={data.top_request_types}
      />
      <ProjectsSlide
        isActive={current === 3}
        topProjects={data.top_projects}
      />
      <RhythmSlide
        isActive={current === 4}
        peakMonth={data.peak_month}
        peakWeekday={data.peak_weekday}
        monthlyBreakdown={data.monthly_breakdown}
      />
      <EfficiencySlide
        isActive={current === 5}
        avgResolutionHours={data.avg_resolution_hours}
        firstContactRate={data.first_contact_rate}
      />
      <ClosingSlide
        isActive={current === 6}
        displayName={data.user.displayName}
        year={data.year}
        onRestart={restart}
      />

      {/* Flechas */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-50 pointer-events-none">
        <button
          className={`pointer-events-auto w-10 h-10 rounded-full border border-border/50 bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card transition-all ${current === 0 ? "opacity-20" : "opacity-70 hover:opacity-100"}`}
          onClick={(e) => { e.stopPropagation(); prev(); }}
          disabled={current === 0}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          className={`pointer-events-auto w-10 h-10 rounded-full border border-border/50 bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card transition-all ${current === TOTAL - 1 ? "opacity-20" : "opacity-70 hover:opacity-100"}`}
          onClick={(e) => { e.stopPropagation(); next(); }}
          disabled={current === TOTAL - 1}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};
