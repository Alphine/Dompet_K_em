import { Link } from "react-router-dom";
import { Receipt, Users, Truck, Package, Settings as SettingsIcon } from "lucide-react";
import { Mascot } from "@/components/Mascot";

const ITEMS = [
  { to: "/transactions", label: "Transaksi", icon: Receipt },
  { to: "/receivables", label: "Piutang", icon: Users },
  { to: "/payables", label: "Utang", icon: Truck },
  { to: "/products", label: "Stok Produk", icon: Package },
  { to: "/settings", label: "Pengaturan", icon: SettingsIcon },
];

export default function More() {
  return (
    <div className="space-y-4" data-testid="more-page">
      <div className="flex items-center gap-3">
        <Mascot expression="smile" className="w-12 h-12" />
        <h1 className="font-heading text-2xl font-bold text-kem-navy">Lainnya</h1>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map((item) => (
          <Link key={item.to} to={item.to} data-testid={`more-link-${item.to.slice(1)}`} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center gap-2 hover:border-kem-teal transition-colors">
            <item.icon size={24} className="text-kem-teal" />
            <span className="text-sm font-medium text-kem-navy">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
