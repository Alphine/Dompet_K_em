import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("simple");

  const refresh = useCallback(async () => {
    if (!user) {
      setBusiness(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/business");
      setBusiness(res.data);
      setMode(res.data.mode || "simple");
    } catch {
      setBusiness(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleMode = async () => {
    const newMode = mode === "simple" ? "advanced" : "simple";
    setMode(newMode);
    try {
      await api.put("/business", { mode: newMode });
    } catch {
      // ignore
    }
  };

  return (
    <BusinessContext.Provider value={{ business, loading, refresh, mode, toggleMode, setBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => useContext(BusinessContext);
