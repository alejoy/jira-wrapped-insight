import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const LoginForm = () => {
  const [year, setYear] = useState(String(new Date().getFullYear() - 1));
  const { loginWithAtlassian } = useAuth();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => String(currentYear - i));

  // Manejar errores que vienen por query string post-callback OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      const messages: Record<string, string> = {
        invalid_state: "Error de seguridad en el login. Intentá de nuevo.",
        token_exchange_failed: "No se pudo completar la autenticacion con Atlassian.",
        no_jira_sites: "Tu cuenta no tiene acceso a ningun sitio de Jira.",
        user_fetch_failed: "No se pudo obtener tu informacion de usuario.",
        server_misconfigured: "Error de configuracion en el servidor.",
      };
      toast.error(messages[err] || `Error de autenticacion: ${err}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden grain">
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-glow-gold blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-glow-green blur-3xl pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(hsl(210 20% 95%) 1px, transparent 1px), linear-gradient(90deg, hsl(210 20% 95%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-hero mb-5 shadow-glow-gold">
            <svg className="w-8 h-8 text-background" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.005 1.005 0 0 0-1.001-1.005zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24.013 12.487V1.005A1.005 1.005 0 0 0 23.013 0z"/>
            </svg>
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight mb-1">
            <span className="text-gradient-gold">BPN</span>{" "}
            <span className="text-foreground">Wrapped</span>
          </h1>
          <p className="text-muted-foreground text-sm">Tu año en la Mesa de Servicios</p>
        </div>

        <div className="space-y-4">
          {/* Selector de año */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
              Año a revisar
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm appearance-none cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Boton OAuth */}
          <button
            onClick={() => loginWithAtlassian(year)}
            className="w-full h-12 rounded-xl bg-gradient-hero text-background font-semibold text-sm tracking-wide shadow-glow-gold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.005 1.005 0 0 0-1.001-1.005zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24.013 12.487V1.005A1.005 1.005 0 0 0 23.013 0z"/>
            </svg>
            Iniciar sesion con Atlassian
          </button>

          <p className="text-center text-muted-foreground/50 text-xs pt-1">
            Usas las mismas credenciales que para entrar a Jira
          </p>
        </div>
      </div>
    </div>
  );
};
