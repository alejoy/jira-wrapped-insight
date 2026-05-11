import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWrappedData } from "@/hooks/useWrappedData";
import { LoginForm } from "@/components/LoginForm";
import { LoadingScreen } from "@/components/ui-wrapped";
import { WrappedPresentation } from "@/components/WrappedPresentation";
import { toast } from "sonner";

const Index = () => {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { data, isLoading: dataLoading, error } = useWrappedData(user);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Verificando sesion inicial
  if (authLoading) return <LoadingScreen />;

  // Sin sesion: mostrar login
  if (!user) return <LoginForm />;

  // Sesion activa pero cargando datos
  if (dataLoading || !data) return <LoadingScreen />;

  return (
    <>
      <button
        onClick={logout}
        title="Cerrar sesion"
        className="fixed top-4 right-4 z-50 w-9 h-9 rounded-full bg-card/80 backdrop-blur border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
        </svg>
      </button>
      <WrappedPresentation data={data} />
    </>
  );
};

export default Index;
