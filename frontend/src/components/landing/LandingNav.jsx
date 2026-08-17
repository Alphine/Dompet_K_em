import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Mascot } from "@/components/Mascot";

export default function LandingNav() {
  const { user } = useAuth();
  return (
    <nav className="sticky top-0 z-40 bg-kem-navy/95 backdrop-blur-sm border-b border-white/5" data-testid="landing-nav">
      <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Mascot expression="smile" className="w-9 h-9" />
          <span className="font-heading font-bold text-white text-lg">Dompet K-eM</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#fitur" data-testid="nav-link-fitur" className="text-white/60 hover:text-white text-sm font-medium transition-colors">Fitur</a>
          <a href="#cara-kerja" data-testid="nav-link-cara-kerja" className="text-white/60 hover:text-white text-sm font-medium transition-colors">Cara Kerja</a>
          <a href="#kem-ai" data-testid="nav-link-kem-ai" className="text-white/60 hover:text-white text-sm font-medium transition-colors">K-eM AI</a>
        </div>
        <Link
          to={user ? "/dashboard" : "/login"}
          data-testid="nav-cta-button"
          className="bg-kem-gold hover:brightness-105 text-kem-navy text-sm font-bold rounded-full px-5 py-2.5 transition-transform active:scale-95"
        >
          {user ? "Buka Dashboard" : "Masuk"}
        </Link>
      </div>
    </nav>
  );
}
