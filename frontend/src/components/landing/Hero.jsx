import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Mascot } from "@/components/Mascot";
import ProductDemoPreview from "@/components/landing/ProductDemoPreview";

export default function Hero() {
  const { user } = useAuth();
  return (
    <section className="bg-kem-navy relative overflow-hidden" data-testid="landing-hero">
      <div className="absolute -top-40 -right-20 w-[30rem] h-[30rem] bg-kem-teal/15 rounded-full blur-3xl" />
      <div className="absolute top-40 -left-32 w-96 h-96 bg-kem-gold/10 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto px-5 md:px-8 pt-14 md:pt-24 pb-20 md:pb-28 relative z-10 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block bg-white/10 text-kem-gold text-xs font-semibold tracking-wide uppercase rounded-full px-3.5 py-1.5 mb-5">
            AI Copilot Keuangan untuk UMKM
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] tracking-tight">
            Catat gampang.<br /> Tahu untung.<br /><span className="text-kem-gold">Kendalikan usaha.</span>
          </h1>
          <p className="text-white/60 text-base md:text-lg mt-6 max-w-md">
            Dompet K-eM bantu pemilik warung, F&B, toko, dan usaha online Indonesia catat transaksi dalam hitungan detik — dan langsung tahu untung sebenarnya, tanpa perlu jadi akuntan.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Link
              to={user ? "/dashboard" : "/login"}
              data-testid="hero-cta-primary"
              className="inline-flex items-center gap-2 bg-kem-gold hover:brightness-105 text-kem-navy font-bold rounded-full px-7 py-3.5 shadow-[0_10px_30px_rgba(245,158,11,0.35)] transition-transform active:scale-95"
            >
              Mulai Gratis <ArrowRight size={17} />
            </Link>
            <a
              href="#cara-kerja"
              data-testid="hero-cta-secondary"
              className="inline-flex items-center gap-2 border border-white/20 text-white font-medium rounded-full px-6 py-3.5 hover:bg-white/5 transition-colors"
            >
              Lihat Cara Kerja
            </a>
          </div>
          <p className="text-white/30 text-xs mt-4">Gratis untuk mulai. Tanpa kartu kredit.</p>
        </div>

        <div className="relative flex justify-center">
          <ProductDemoPreview />
          <Mascot
            expression="celebrating"
            className="w-16 h-16 absolute -bottom-4 -right-2 sm:-right-6 drop-shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}
