import { Mascot } from "@/components/Mascot";

export default function AIShowcase() {
  return (
    <section id="kem-ai" className="bg-kem-navy py-16 md:py-20 relative overflow-hidden" data-testid="landing-ai-showcase">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-kem-teal/10 rounded-full blur-3xl" />
      <div className="max-w-6xl mx-auto px-5 md:px-8 relative z-10 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-kem-gold text-xs font-bold uppercase tracking-wide">K-eM AI Copilot</span>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mt-2 leading-snug">
            Bukan chatbot biasa. K-eM memahami data usaha Anda yang sebenarnya.
          </h2>
          <p className="text-white/60 text-sm md:text-base mt-4 max-w-md">
            Setiap jawaban dihitung dari transaksi yang benar-benar Anda catat — bukan tebakan AI. Angka estimasi selalu diberi label jelas.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Mascot expression="thinking" className="w-10 h-10" />
            <p className="text-white/50 text-xs italic">"Saya tidak akan menjawab kalau datanya belum cukup."</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-2xl" data-testid="ai-showcase-chat-mock">
          <div className="flex justify-end mb-3">
            <div className="bg-kem-navy text-white text-sm rounded-2xl px-4 py-2.5 max-w-[80%]">Kenapa laba turun bulan ini?</div>
          </div>
          <div className="flex items-start gap-2">
            <Mascot expression="smile" className="w-7 h-7 mt-1 shrink-0" />
            <div className="bg-slate-50 border-l-4 border-kem-teal rounded-2xl px-4 py-3 text-sm text-kem-text space-y-1.5">
              <p><strong className="text-kem-navy">Laba bersih turun 18%</strong> dibanding bulan lalu.</p>
              <p className="text-kem-muted">Omzet naik Rp2,1 juta, tapi biaya operasional naik Rp3,4 juta — terutama marketing dan pengiriman.</p>
              <p className="text-kem-teal font-medium">Saran K-eM: review dua biaya terbesar sebelum menambah pengeluaran baru.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
