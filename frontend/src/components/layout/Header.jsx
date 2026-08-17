import { useNavigate } from "react-router-dom";
import { LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { Switch } from "@/components/ui/switch";

export default function Header() {
  const { user, logout } = useAuth();
  const { business, mode, toggleMode } = useBusiness();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30" data-testid="app-header">
      <div className="md:hidden">
        <p className="font-heading font-bold text-kem-navy">{business?.business_name}</p>
      </div>
      <div className="hidden md:block">
        <p className="text-sm text-kem-muted">Selamat datang kembali,</p>
        <p className="font-heading font-semibold text-kem-navy">{user?.name}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1.5">
          <Sparkles size={13} className="text-kem-teal" />
          <span className="text-xs font-medium text-kem-navy">{mode === "simple" ? "Mode Simple" : "Mode Lanjutan"}</span>
          <Switch data-testid="mode-toggle-switch" checked={mode === "advanced"} onCheckedChange={toggleMode} className="scale-75" />
        </div>
        {user?.picture ? (
          <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full hidden md:block" />
        ) : null}
        <button data-testid="logout-button" onClick={handleLogout} className="text-kem-muted hover:text-kem-navy transition-colors" aria-label="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
