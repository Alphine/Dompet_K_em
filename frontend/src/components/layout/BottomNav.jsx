import { NavLink } from "react-router-dom";
import { LayoutDashboard, BarChart3, Bot, MoreHorizontal } from "lucide-react";

const LINKS = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/reports", label: "Laporan", icon: BarChart3 },
];

export default function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 h-20 flex items-stretch z-40"
      data-testid="mobile-bottom-nav"
    >
      {LINKS.slice(0, 1).map((l) => (
        <NavItem key={l.to} {...l} />
      ))}
      <div className="flex-1" />
      <div className="flex-1" />
      {LINKS.slice(1).map((l) => (
        <NavItem key={l.to} {...l} />
      ))}
      <NavItem to="/assistant" label="K-eM" icon={Bot} />
      <NavItem to="/more" label="Lainnya" icon={MoreHorizontal} />
    </nav>
  );
}

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      data-testid={`bottom-nav-${to.slice(1)}`}
      className={({ isActive }) =>
        `flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${
          isActive ? "text-kem-teal" : "text-kem-muted"
        }`
      }
    >
      <Icon size={20} />
      {label}
    </NavLink>
  );
}
