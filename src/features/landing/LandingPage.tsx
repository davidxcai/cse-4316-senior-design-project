import CurriculumSection from "./components/CurriculumSection";
import Footer from "./components/Footer";
import HowItWorksSection from "./components/HowItWorksSection";
import MissionSection from "./components/MissionSection";
import PrivacySection from "./components/PrivacySection";
import TryItHero from "./components/TryItHero";

export default function LandingPage() {
  return (
    <>
      <main>
        <TryItHero />
        <HowItWorksSection />
        <CurriculumSection />
        <MissionSection />
        <PrivacySection />
      </main>
      <Footer />
    </>
  );
}
