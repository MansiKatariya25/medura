import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";
import Features from "@/components/landing/Features";
import Ecosystem from "@/components/landing/Ecosystem";
import MedKeySpotlight from "@/components/landing/MedKeySpotlight";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import Footer from "@/components/landing/Footer";
import NoiseOverlay from "@/components/landing/ui/NoiseOverlay";

export default function LandingPage() {
    return (
        <main className="min-h-screen w-full bg-[#091E42] text-white">
            <NoiseOverlay />
            <Navbar />
            <Hero />
            <Stats />
            <Features />
            <Ecosystem />
            <MedKeySpotlight />
            <HowItWorks />
            <Testimonials />
            <Footer />
        </main>
    );
}
