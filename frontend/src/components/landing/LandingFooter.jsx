import { Mascot } from "@/components/Mascot";

export default function LandingFooter() {
  return (
    <footer className="bg-kem-navy border-t border-white/5 py-8" data-testid="landing-footer">
      <div className="max-w-6xl mx-auto px-5 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Mascot expression="normal" className="w-7 h-7" />
          <div>
            <p className="font-heading font-bold text-white text-sm leading-none">Dompet K-eM</p>
            <p className="text-white/30 text-xs">Keuangan yang Mudah</p>
          </div>
        </div>
        <p className="text-white/30 text-xs">© 2026 Dompet K-eM. Dibuat untuk UMKM Indonesia.</p>
      </div>
    </footer>
  );
}
