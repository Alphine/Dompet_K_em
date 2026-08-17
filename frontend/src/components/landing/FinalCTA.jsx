import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Mascot } from "@/components/Mascot";

export default function FinalCTA() {
  const { user } = useAuth();
  return (
    <section className="bg-kem-bg py-16 md:py-20" data-testid="landing-final-cta">
      <div className="max-w-4xl mx-auto px-5 md:px-8">
        <div className="bg-kem-navy rounded-3xl px-8 py-12 md:py-16 text-center relative overflow-hidden">
          <div className="absolute -bottom-16 -right-16 w-72 h-72 bg-kem-gold/10 rounded-full blur-3xl" />
          <Mascot expression="celebrating" className="w-20 h-20 mx-auto mb-5" />
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-white max-w-xl mx-auto relative z-10">
            Siap kendalikan usaha Anda?
          </h2>
          <p className="text-white/60 text-sm md:text-base mt-3 relative z-10">Mulai catat transaksi pertama Anda hari ini, gratis.</p>
          <Link
            to={user ? "/dashboard" : "/login"}
            data-testid="final-cta-button"
            className="inline-flex items-center gap-2 bg-kem-gold hover:brightness-105 text-kem-navy font-bold rounded-full px-7 py-3.5 mt-7 shadow-[0_10px_30px_rgba(245,158,11,0.35)] transition-transform active:scale-95 relative z-10"
          >
            Mulai Gratis Sekarang <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
