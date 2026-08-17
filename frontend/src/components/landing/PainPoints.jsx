import { FileWarning, Shuffle, ClockAlert } from "lucide-react";

const PAINS = [
  { icon: FileWarning, title: "Catatan Berantakan", desc: "Nota kertas, WhatsApp, dan spreadsheet yang tidak pernah sinkron satu sama lain." },
  { icon: Shuffle, title: "Untung vs Kas Tercampur", desc: "Kas di rekening terlihat banyak, tapi belum tentu itu artinya usaha untung." },
  { icon: ClockAlert, title: "Piutang Lupa Ditagih", desc: "Pelanggan yang belum bayar sering terlupa sampai akhirnya jadi kerugian." },
];

export default function PainPoints() {
  return (
    <section className="bg-white py-16 md:py-20" data-testid="landing-pain-points">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="max-w-lg mb-12">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-kem-navy">
            Kebanyakan UMKM tahu berapa yang masuk — tapi tidak tahu berapa untungnya.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PAINS.map((p) => (
            <div key={p.title} className="border border-slate-200 rounded-2xl p-6" data-testid={`pain-point-${p.title.slice(0, 8)}`}>
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                <p.icon size={20} className="text-red-500" />
              </div>
              <p className="font-heading font-semibold text-kem-navy mb-1.5">{p.title}</p>
              <p className="text-sm text-kem-muted leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
