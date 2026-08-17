import { Mascot } from "@/components/Mascot";

const STEPS = [
  { n: "01", title: "Catat", desc: "Rekam penjualan, pengeluaran, atau pembelian dalam hitungan detik lewat tombol + RECORD, bahkan dengan suara.", mascot: "saving" },
  { n: "02", title: "Pahami", desc: "Dashboard otomatis menghitung kas, omzet, dan laba — K-eM AI siap menjelaskan angka apapun yang Anda tanyakan.", mascot: "analyzing" },
  { n: "03", title: "Kendalikan", desc: "Dapatkan alert saat kas menipis, piutang jatuh tempo, atau biaya melonjak — sebelum jadi masalah besar.", mascot: "happy" },
];

export default function HowItWorks() {
  return (
    <section id="cara-kerja" className="bg-white py-16 md:py-20" data-testid="landing-how-it-works">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="max-w-lg mb-12">
          <span className="text-kem-teal text-xs font-bold uppercase tracking-wide">Cara Kerja</span>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-kem-navy mt-2">Tiga langkah dari catatan ke keputusan.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((s) => (
            <div key={s.n} className="relative" data-testid={`how-it-works-step-${s.n}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-heading text-3xl font-extrabold text-slate-200">{s.n}</span>
                <Mascot expression={s.mascot} className="w-12 h-12" />
              </div>
              <p className="font-heading text-lg font-bold text-kem-navy mb-1.5">{s.title}</p>
              <p className="text-sm text-kem-muted leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
