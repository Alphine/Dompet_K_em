import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("simple");
  const [lastUserId, setLastUserId] = useState(undefined);

  const currentUserId = user ? user.user_id : null;

  // Adjust state synchronously DURING render when the user identity changes,
  // so AppShell never sees a stale {loading:false, business:null} frame
  // for the new user before the fetch effect has a chance to run.
  if (currentUserId !== lastUserId) {
    setLastUserId(currentUserId);
    setLoading(true);
    setBusiness(null);
  }

  const refresh = useCallback(async () => {
    if (!currentUserId) {
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
  }, [currentUserId]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [refresh, authLoading]);

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
