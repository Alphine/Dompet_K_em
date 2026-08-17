import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wallet, TrendingUp, ShoppingCart, Receipt, Package, Truck, Send } from "lucide-react";
import { Mascot } from "@/components/Mascot";

const SCENES = ["dashboard", "record", "chat"];

export default function ProductDemoPreview() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActive((i) => (i + 1) % SCENES.length), 4200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div data-testid="landing-demo-preview" className="w-[320px] sm:w-[360px]">
      <div className="bg-white rounded-[1.75rem] shadow-2xl overflow-hidden border border-white/10">
        <div className="bg-slate-50 h-9 flex items-center gap-1.5 px-4 border-b border-slate-100">
          <span className="w-2 h-2 rounded-full bg-red-300" />
          <span className="w-2 h-2 rounded-full bg-amber-300" />
          <span className="w-2 h-2 rounded-full bg-emerald-300" />
          <span className="text-[10px] text-kem-muted font-medium mx-auto pr-6">Dompet K-eM</span>
        </div>

        <div className="relative h-[380px] overflow-hidden bg-kem-bg">
          <AnimatePresence mode="wait">
            {SCENES[active] === "dashboard" && <DashboardScene key="dashboard" />}
            {SCENES[active] === "record" && <RecordScene key="record" />}
            {SCENES[active] === "chat" && <ChatScene key="chat" />}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex justify-center gap-1.5 mt-4">
        {SCENES.map((s, i) => (
          <span
            key={s}
            data-testid={`demo-preview-dot-${i}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-6 bg-kem-gold" : "w-1.5 bg-white/25"}`}
          />
        ))}
      </div>
    </div>
  );
}

const sceneVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

function DashboardScene() {
  return (
    <motion.div variants={sceneVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }} className="absolute inset-0 p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-kem-navy rounded-2xl p-4 text-white">
        <p className="text-white/50 text-[10px] flex items-center gap-1"><Wallet size={10} /> Total Kas</p>
        <p className="font-heading font-extrabold text-2xl mt-0.5">Rp8.450.000</p>
      </motion.div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {[
          { l: "Omzet", v: "Rp18,4jt", c: "text-kem-navy" },
          { l: "Laba Kotor", v: "Rp6,8jt", c: "text-kem-teal" },
          { l: "Laba Bersih", v: "Rp3,1jt", c: "text-kem-green" },
          { l: "Piutang", v: "Rp1,2jt", c: "text-kem-gold" },
        ].map((k, i) => (
          <motion.div key={k.l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }} className="bg-white rounded-xl p-2.5 border border-slate-100">
            <p className="text-[9px] text-kem-muted">{k.l}</p>
            <p className={`font-heading font-bold text-sm ${k.c}`}>{k.v}</p>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-3 bg-amber-50 border-l-4 border-kem-gold rounded-xl p-2.5">
        <p className="text-[10px] text-amber-800 font-medium">⚠ Rp3,2jt piutang lewat jatuh tempo</p>
      </motion.div>
    </motion.div>
  );
}

function RecordScene() {
  const items = [
    { icon: ShoppingCart, label: "Penjualan", active: true },
    { icon: Receipt, label: "Pengeluaran" },
    { icon: Package, label: "Pembelian" },
    { icon: Truck, label: "Bayar Pemasok" },
  ];
  return (
    <motion.div variants={sceneVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }} className="absolute inset-0 p-4">
      <p className="font-heading font-semibold text-kem-navy text-sm mb-3">Catat Transaksi</p>
      <div className="grid grid-cols-2 gap-2">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: it.active ? [1, 1.04, 1] : 1 }}
            transition={{ delay: i * 0.08, scale: { delay: 0.6, duration: 1, repeat: it.active ? 2 : 0 } }}
            className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border ${it.active ? "border-kem-teal bg-kem-teal/5" : "border-slate-100"}`}
          >
            <it.icon size={18} className={it.active ? "text-kem-teal" : "text-kem-muted"} />
            <span className="text-[10px] font-medium text-kem-navy">{it.label}</span>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-4 bg-white rounded-xl border border-slate-100 p-3">
        <p className="text-[9px] text-kem-muted mb-1">Jumlah Penjualan</p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="font-heading font-bold text-xl text-kem-navy">Rp50.000</motion.p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7 }} className="mt-3 bg-emerald-50 text-emerald-700 text-[11px] font-medium rounded-xl px-3 py-2 text-center">
        ✓ Penjualan tersimpan dalam 8 detik
      </motion.div>
    </motion.div>
  );
}

function ChatScene() {
  return (
    <motion.div variants={sceneVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }} className="absolute inset-0 p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Mascot expression="analyzing" className="w-6 h-6" />
        <p className="font-heading font-semibold text-kem-navy text-sm">K-eM AI</p>
      </div>
      <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="self-end bg-kem-navy text-white text-xs rounded-2xl px-3.5 py-2 max-w-[75%]">
        Kenapa laba turun bulan ini?
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-3 bg-white border-l-4 border-kem-teal rounded-2xl px-3.5 py-3 text-[11px] text-kem-text space-y-1.5 shadow-sm">
        <p><strong className="text-kem-navy">Laba bersih turun 18%</strong> dari bulan lalu.</p>
        <p className="text-kem-muted">Biaya marketing & pengiriman naik Rp3,4 juta.</p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="text-kem-teal font-medium flex items-center gap-1">
          <Send size={10} /> Saran: review 2 biaya terbesar Anda.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
