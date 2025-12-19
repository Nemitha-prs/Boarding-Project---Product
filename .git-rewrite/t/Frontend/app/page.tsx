import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import FeaturedBoardings from "../components/FeaturedBoardings";
import FeaturesGrid from "../components/FeaturesGrid";
import WhyChooseUs from "../components/WhyChooseUs";
import Footer from "../components/Footer";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="bg-[#F7F7F8] opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
        <HeroSection />
        <FeaturedBoardings />
        <FeaturesGrid />
        <WhyChooseUs />
      </main>
      <Footer />
    </>
  );
}
