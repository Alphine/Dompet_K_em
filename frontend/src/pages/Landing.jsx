import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import TrustBar from "@/components/landing/TrustBar";
import PainPoints from "@/components/landing/PainPoints";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import AIShowcase from "@/components/landing/AIShowcase";
import FinalCTA from "@/components/landing/FinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Landing() {
  return (
    <div data-testid="landing-page">
      <LandingNav />
      <Hero />
      <TrustBar />
      <PainPoints />
      <Features />
      <HowItWorks />
      <AIShowcase />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
