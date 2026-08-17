import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Mascot } from "@/components/Mascot";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = location.hash || window.location.hash;
    const sessionId = hash.split("session_id=")[1]?.split("&")[0];
    if (!sessionId) {
      navigate("/login", { replace: true });
      return;
    }

    api
      .post("/auth/session", { session_id: sessionId })
      .then((res) => {
        setUser(res.data);
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/dashboard", { replace: true, state: { user: res.data } });
      })
      .catch(() => {
        setError(true);
        setTimeout(() => navigate("/login", { replace: true }), 1500);
      });
  }, [location, navigate, setUser]);

  return (
    <div className="min-h-screen bg-kem-navy flex flex-col items-center justify-center gap-4" data-testid="auth-callback">
      <Mascot expression={error ? "sad" : "loading"} className="w-24 h-24 animate-pulse" />
      <p className="text-white/70 text-sm">{error ? "Login gagal, mengarahkan ulang..." : "Menyelesaikan proses masuk..."}</p>
    </div>
  );
}
