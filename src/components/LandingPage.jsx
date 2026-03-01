import { useEffect, useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, BarChart3, Shield } from 'lucide-react'

// Lazy load the heavy canvas component
const CrowdCanvas = lazy(() => 
  import('./ui/skiper-ui/skiper39').then(module => ({ default: module.CrowdCanvas }))
)
 
// Component to handle font randomization for a specific word
const RandomFontWord = ({ word }) => {
  const fonts = [
    'font-sans', 
    'font-serif', 
    'font-mono', 
    'italic font-serif', 
    'font-black tracking-tighter'
  ];
  const [fontClass, setFontClass] = useState(fonts[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomFont = fonts[Math.floor(Math.random() * fonts.length)];
      setFontClass(randomFont);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`${fontClass} transition-all duration-300 inline-block`}>
      {word}
    </span>
  );
};

function LandingPage() {
  return (
    <div className="relative h-screen w-full bg-white overflow-hidden flex items-center justify-center">
      
      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo Section */}
            <div className="flex items-center gap-3">

              <h1 className="text-2xl font-extrabold uppercase tracking-wider ">
                CrimeArch
              </h1>
            </div>

            {/* Login Button */}
            <Link
              to="/auth"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium text-sm transition-all duration-300 hover:opacity-90 hover:shadow-lg active:scale-95"
              style={{ backgroundColor: "#000" }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* 1. BACKGROUND LAYER: Crowd Canvas */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <Suspense fallback={<div className="w-full h-full bg-gray-50" />}>
          <CrowdCanvas 
            src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/open-peeps-sheet.png" 
            rows={15} 
            cols={7} 
          />
        </Suspense>
      </div>

      {/* 2. CONTENT LAYER: Centered */}
      <div className="relative z-10 mb-30 w-full max-w-5xl px-6 flex flex-col items-center text-center">
        
        {/* Main Heading with Randomization & Theme Color */}
        <h1 className="uppercase text-6xl md:text-9xl font-extrabold text-zinc-900 leading-[0.9] tracking-tight mb-8 animate-title-slide-up">
          The future of <br />
          <span className="text-[#131314]">Safety</span> is Here
        </h1>

{/* <RandomFontWord word="AI" /> */}
        {/* Concise Description */}
        <p className="text-lg md:text-xl text-black font-semibold max-w-xl mb-12 animate-fade-in opacity-0 [animation-delay:400ms]">
          A unified platform where AI analyzes crime patterns, predicts hotspots, 
          and optimizes patrol routes effortlessly.
        </p>

        {/* Elegant CTA */}
        {/* <div className="flex flex-col sm:flex-row gap-6 animate-fade-in opacity-0 [animation-delay:600ms]">
          <Link
            to="/auth"
            className="group relative px-12 py-4 bg-[#667eea] uppercase cursor-pointer text-white rounded-full font-bold overflow-hidden transition-all hover:pr-14"
          >
            <span className="relative z-10">Get Started</span>
            <ArrowRight 
              className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all text-white" 
              size={20} 
            />
          </Link>
        </div> */}

      </div>

      {/* 3. BOTTOM FADING EFFECT */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-5">
        <div 
          className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-white to-transparent"
          style={{
            maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)'
          }}
        />
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }

        .animate-title-slide-up {
          animation: titleSlideUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes titleSlideUp {
          from { opacity: 0; transform: translateY(60px) skewY(2deg); }
          to { opacity: 1; transform: translateY(0) skewY(0); }
        }
      `}</style>
    </div>
  )
}

export default LandingPage