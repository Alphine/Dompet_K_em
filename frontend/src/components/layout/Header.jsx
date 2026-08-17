import { useNavigate } from "react-router-dom";
import { LogOut, Sparkles, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/context/BusinessContext";
import { useNotifications, useInvalidateFinance } from "@/lib/hooks";
import api from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function Header() {
  const { user, logout } = useAuth();
  const { business, mode, toggleMode } = useBusiness();
  const { data: notifData } = useNotifications();
  const invalidate = useInvalidateFinance();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleNotifClick = async (n) => {
    if (!n.is_read) {
      await api.post(`/notifications/${n.id}/read`);
      invalidate();
    }
    if (n.link) navigate(n.link);
  };

  const notifications = notifData?.items || [];
  const unread = notifData?.unread_count || 0;

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

        <Popover>
          <PopoverTrigger data-testid="notification-bell-button" className="relative text-kem-muted hover:text-kem-navy transition-colors">
            <Bell size={18} />
            {unread > 0 && (
              <span data-testid="notification-unread-badge" className="absolute -top-1.5 -right-1.5 bg-kem-gold text-kem-navy text-[10px] font-bold rounded-full w-4.5 h-4.5 min-w-[18px] flex items-center justify-center">
                {unread}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 rounded-2xl" data-testid="notification-panel">
            <div className="p-3 border-b border-slate-100 font-heading font-semibold text-sm text-kem-navy">Notifikasi</div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-xs text-kem-muted p-4 text-center">Belum ada notifikasi.</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    data-testid={`notification-item-${n.id}`}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full text-left p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 ${!n.is_read ? "bg-teal-50/50" : ""}`}
                  >
                    <p className="text-xs font-semibold text-kem-navy">{n.title}</p>
                    <p className="text-xs text-kem-muted mt-0.5">{n.message}</p>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

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
