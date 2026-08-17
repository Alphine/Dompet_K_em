import { Zap, LayoutDashboard, Users, Package, FileBarChart, Bot } from "lucide-react";

const FEATURES = [
  { icon: Zap, title: "+ Record Secepat Kilat", desc: "Catat penjualan dalam <20 detik, pengeluaran <15 detik. Cukup ketuk, isi jumlah, simpan.", color: "text-kem-gold", bg: "bg-amber-50" },
  { icon: LayoutDashboard, title: "Dashboard yang Jelas", desc: "Kas, omzet, laba kotor & bersih — semua dihitung otomatis dari transaksi yang Anda catat.", color: "text-kem-navy", bg: "bg-slate-50" },
  { icon: Users, title: "Piutang & Utang", desc: "Tahu siapa yang belum bayar dan tagihan apa yang harus dibayar minggu ini, lengkap dengan umur piutang.", color: "text-kem-teal", bg: "bg-teal-50" },
  { icon: Package, title: "Stok Produk Ringan", desc: "Pantau stok, harga modal, dan harga jual tanpa kerumitan sistem gudang.", color: "text-kem-green", bg: "bg-emerald-50" },
  { icon: FileBarChart, title: "Laporan Lengkap", desc: "Laba rugi, arus kas, penjualan, dan pengeluaran — siap export CSV kapan saja.", color: "text-kem-navy", bg: "bg-slate-50" },
  { icon: Bot, title: "K-eM AI Copilot", desc: "Tanya 'kenapa laba turun?' dan dapatkan jawaban berbasis data asli usaha Anda, bukan tebakan.", color: "text-kem-teal", bg: "bg-teal-50" },
];

export default function Features() {
  return (
    <section id="fitur" className="bg-kem-bg py-16 md:py-20" data-testid="landing-features">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="max-w-lg mb-12">
          <span className="text-kem-teal text-xs font-bold uppercase tracking-wide">Fitur</span>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-kem-navy mt-2">Semua yang usaha kecil butuhkan, tanpa yang tidak perlu.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow" data-testid={`feature-card-${f.title.slice(0, 8)}`}>
              <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                <f.icon size={20} className={f.color} />
              </div>
              <p className="font-heading font-semibold text-kem-navy mb-1.5">{f.title}</p>
              <p className="text-sm text-kem-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
