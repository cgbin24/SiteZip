import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import Features from "@/components/site/Features";
import HowItWorks from "@/components/site/HowItWorks";
import Install from "@/components/site/Install";
import Disclaimer from "@/components/site/Disclaimer";
import Footer from "@/components/site/Footer";

function App() {
  return (
    <div className="App sz-noise bg-[var(--sz-bg)] text-[var(--sz-text)]" data-testid="app-root">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Install />
        <Disclaimer />
      </main>
      <Footer />
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

export default App;
