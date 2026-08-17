import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Mascot } from "@/components/Mascot";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (location.state?.user) return children;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-kem-bg" data-testid="auth-loading">
        <Mascot expression="loading" className="w-20 h-20 animate-pulse" />
        <p className="text-kem-muted text-sm">Memuat...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
