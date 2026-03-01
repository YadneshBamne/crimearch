import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, MapPin, TrendingUp, Database, Bot, ChevronRight, ChevronLeft } from 'lucide-react'

// ── Shared style tokens (matching AuthPage) ──────────────────────────
const primaryBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
  width: '100%', height: '44px', borderRadius: '10px', fontSize: '13px',
  fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#f1f1f1',
}

const ghostBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
  height: '44px', borderRadius: '10px', fontSize: '13px',
  fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  color: 'rgba(255,255,255,0.55)',
  padding: '0 20px',
}

function OnboardingScreen({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()

  const steps = [
    {
      icon: Shield,
      iconColor: 'rgba(96,165,250,0.8)',
      title: "Welcome to CrimeArch",
      subtitle: "Your intelligent crime monitoring platform",
      description: "Stay informed about crime patterns in your area with real-time data and insights. Access comprehensive analytics to make informed decisions for public safety.",
      features: ['Live Crime Updates', 'Interactive Maps', 'Smart Analytics']
    },
    {
      icon: Bot,
      iconColor: 'rgba(52,211,153,0.8)',
      title: "Automated Scraping",
      subtitle: "No manual work required",
      description: "Our system automatically scrapes crime news from multiple trusted sources every hour, keeping you updated with the latest incidents without any manual intervention.",
      features: ['Hourly Updates', 'Multiple Sources', 'Auto Processing']
    },
    {
      icon: Database,
      iconColor: 'rgba(168,85,247,0.8)',
      title: "Smart Processing",
      subtitle: "AI-powered data extraction",
      description: "Advanced algorithms parse and categorize crime data, extracting locations, crime types, and timestamps to provide structured, actionable information you can rely on.",
      features: ['Location Parsing', 'Type Classification', 'Time Detection']
    },
    {
      icon: MapPin,
      iconColor: 'rgba(251,113,133,0.8)',
      title: "Interactive Map",
      subtitle: "Visualize crime patterns",
      description: "Explore crime incidents on an interactive map. Filter by crime type, view clusters, see temporal patterns, and analyze trends in your neighborhood or city.",
      features: ['Crime Heatmaps', 'Type Filters', 'Cluster Analysis']
    },
    {
      icon: TrendingUp,
      iconColor: 'rgba(251,191,36,0.8)',
      title: "Advanced Analytics",
      subtitle: "Data-driven insights",
      description: "Get deep insights with hotspot analysis, trend graphs, temporal patterns, and AI-powered patrol route optimization designed for law enforcement agencies.",
      features: ['Hotspot Detection', 'Trend Analysis', 'Patrol Routes']
    }
  ]

  const currentStepData = steps[currentStep]
  const Icon = currentStepData.icon

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    onComplete()
    navigate('/map')
  }

  const handleSkip = () => {
    onSkip()
    navigate('/map')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Left Panel ─────────────────────────────────── */}
      <div
        className="hidden lg:flex"
        style={{
          width: '50%', flexDirection: 'column', justifyContent: 'space-between',
          padding: '48px', position: 'relative', overflow: 'hidden',
          background: '#0d0d0d',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Grid texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025,
          backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 48px)',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <Shield size={18} color="rgba(255,255,255,0.6)" />
          </div>
          <span style={{ fontSize: '17px', fontWeight: '700', color: '#e5e5e5', letterSpacing: '-0.02em' }}>
            CrimeArch
          </span>
        </div>

        {/* Hero content */}
        <div style={{ position: 'relative' }}>
          {/* Icon display */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '18px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <Icon size={36} color={currentStepData.iconColor} />
          </div>

          <p style={{
            fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)', marginBottom: '12px',
          }}>
            Step {currentStep + 1} of {steps.length}
          </p>

          <h2 style={{
            fontSize: '32px', fontWeight: '700', color: '#f1f1f1',
            lineHeight: 1.25, letterSpacing: '-0.03em', margin: '0 0 8px',
          }}>
            {currentStepData.title}
          </h2>

          <p style={{
            fontSize: '15px', color: 'rgba(255,255,255,0.5)',
            margin: '0 0 20px', fontWeight: '500',
          }}>
            {currentStepData.subtitle}
          </p>

          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, margin: '0 0 24px' }}>
            {currentStepData.description}
          </p>

          {/* Feature chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {currentStepData.features.map(feature => (
              <span key={feature} style={{
                fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)',
                padding: '5px 12px', borderRadius: '999px',
              }}>
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'relative' }}>
          {/* Progress bar */}
          <div style={{
            height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px',
            marginBottom: '16px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', background: 'rgba(255,255,255,0.2)',
              width: `${((currentStep + 1) / steps.length) * 100}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>© 2026 CrimeArch</span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
              {currentStep + 1} / {steps.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────────── */}
      <div style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', background: '#0a0a0a',
      }}
        className="lg:w-1/2"
      >
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Mobile header */}
          <div className="lg:hidden" style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <Icon size={32} color={currentStepData.iconColor} />
            </div>
            <h2 style={{
              margin: '0 0 8px', fontSize: '24px', fontWeight: '700',
              color: '#f1f1f1', letterSpacing: '-0.02em',
            }}>
              {currentStepData.title}
            </h2>
            <p style={{ margin: '0 0 4px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
              {currentStepData.subtitle}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
              {currentStepData.description}
            </p>
          </div>

          {/* Feature list */}
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <p style={{
              fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)', marginBottom: '12px',
            }}>
              Key Features
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentStepData.features.map((feature, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: currentStepData.iconColor,
                  }} />
                  <span style={{ fontSize: '13px', color: '#e5e5e5', fontWeight: '500' }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step indicators (dots) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                style={{
                  width: index === currentStep ? '24px' : '6px',
                  height: '6px',
                  borderRadius: '999px',
                  background: index === currentStep ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              style={{
                ...ghostBtn,
                opacity: currentStep === 0 ? 0.3 : 1,
                cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              }}
              onMouseOver={e => { if (currentStep !== 0) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button
              onClick={handleNext}
              style={{ ...primaryBtn, flex: 1 }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Skip option */}
          <p style={{ margin: 0, textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            {currentStep < steps.length - 1 ? (
              <>
                Already familiar?{' '}
                <button
                  type="button"
                  onClick={handleSkip}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', padding: 0,
                  }}
                >
                  Skip tutorial
                </button>
              </>
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Ready to explore</span>
            )}
          </p>

        </div>
      </div>
    </div>
  )
}

export default OnboardingScreen
