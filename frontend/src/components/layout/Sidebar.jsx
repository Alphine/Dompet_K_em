import { NavLink } from "react-router-dom";
import { LayoutDashboard, Receipt, Users, Truck, Package, BarChart3, Bot, Settings } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { useBusiness } from "@/context/BusinessContext";

const LINKS = [
  { to: "/dashboard", label: "Beranda", icon: LayoutDashboard },
  { to: "/transactions", label: "Transaksi", icon: Receipt },
  { to: "/receivables", label: "Piutang", icon: Users },
  { to: "/payables", label: "Utang", icon: Truck },
  { to: "/products", label: "Stok Produk", icon: Package },
  { to: "/reports", label: "Laporan", icon: BarChart3 },
  { to: "/assistant", label: "K-eM AI", icon: Bot },
  { to: "/settings", label: "Pengaturan", icon: Settings },
];

export default function Sidebar() {
  const { business } = useBusiness();
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-kem-navy text-white" data-testid="desktop-sidebar">
      <div className="flex items-center gap-3 px-6 py-6">
        <Mascot expression="smile" className="w-10 h-10" />
        <div>
          <p className="font-heading font-bold text-lg leading-none">K-eM</p>
          <p className="text-white/40 text-xs">Dompet K-eM</p>
        </div>
      </div>
      <div className="px-6 mb-4">
        <p className="text-white/40 text-xs uppercase tracking-wide">Usaha Aktif</p>
        <p className="font-semibold truncate">{business?.business_name}</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            data-testid={`sidebar-link-${l.to.slice(1)}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <l.icon className="w-4.5 h-4.5" size={18} />
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
