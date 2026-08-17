const SEGMENTS = ["Warung", "F&B", "Toko Retail", "Reseller", "Penjual Online", "Jasa", "Industri Rumahan", "Distributor Kecil"];

export default function TrustBar() {
  return (
    <div className="bg-kem-navy border-t border-white/5 py-5" data-testid="landing-trust-bar">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <p className="text-white/30 text-xs text-center mb-3 uppercase tracking-wide">Dirancang untuk</p>
        <div className="flex flex-wrap justify-center gap-2.5">
          {SEGMENTS.map((s) => (
            <span key={s} className="text-white/70 text-xs font-medium bg-white/5 rounded-full px-3.5 py-1.5">{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
