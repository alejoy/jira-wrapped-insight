import { useState, useEffect } from "react";
import { WrappedSummary } from "@/types/wrapped";
import { AuthUser } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export const useWrappedData = (user: AuthUser | null) => {
  const [data, setData] = useState<WrappedSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Recuperar el año que el usuario seleccionó antes del redirect OAuth
    const year = sessionStorage.getItem("selected_year") || String(new Date().getFullYear() - 1);

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/jira?year=${year}`, {
          credentials: "include", // enviar cookie de sesion
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || `Error ${res.status}`);
        setData(result);
      } catch (err: any) {
        setError(err.message || "Error al cargar los datos");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return { data, isLoading, error };
};
