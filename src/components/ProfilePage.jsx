import { LogOut, User, Mail, Calendar, Shield, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function ProfilePage({ user, onLogout, onResetOnboarding }) {
  const navigate = useNavigate()
  
  if (!user) return null

  const handleViewTutorial = () => {
    onResetOnboarding()
    navigate('/onboarding')
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#0a0a0a' }}>
      <div className="max-w-2xl mx-auto">

        {/* Main Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
          }}
        >
          {/* Header */}
          <div
            className="p-8 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1c1c1c 0%, #141414 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Subtle grid texture */}
            <div
              style={{
                position: 'absolute', inset: 0, opacity: 0.03,
                backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)',
              }}
            />

            <div className="relative flex items-center gap-5">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(160deg, #2a2a2a, #1a1a1a)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <User className="w-9 h-9" style={{ color: 'rgba(255,255,255,0.7)' }} />
              </div>

              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#f1f1f1', letterSpacing: '-0.02em' }}>
                  {user.name || 'User'}
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80' }} />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Active Account</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Fields */}
          <div className="p-8 space-y-3">
            {[
              { icon: Mail,     label: 'Email Address', value: user.email,  },
              user.name && { icon: User, label: 'Full Name',     value: user.name,  },
              
            ].filter(Boolean).map(({ icon: Icon, label, value }, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="p-2.5 rounded-lg flex-shrink-0"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {label}
                  </p>
                  <p className="text-sm font-medium mt-0.5 truncate" style={{ color: '#e5e5e5' }}>
                    {value}
                  </p>
                </div>
              </div>
            ))}

            {/* Logout */}
            <div className="pt-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {/* View Tutorial Again Button */}
              {onResetOnboarding && (
                <button
                  onClick={handleViewTutorial}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200"
                  style={{
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    color: 'rgba(96,165,250,0.9)',
                    letterSpacing: '0.01em',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.15)'
                    e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'
                    e.currentTarget.style.color = '#60a5fa'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.1)'
                    e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)'
                    e.currentTarget.style.color = 'rgba(96,165,250,0.9)'
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <BookOpen className="w-4 h-4" />
                  View Tutorial Again
                </button>
              )}

              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: 'rgba(255,255,255,0.7)',
                  letterSpacing: '0.01em',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
                  e.currentTarget.style.color = '#f87171'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* About Card */}
        {/* <div
          className="mt-4 rounded-2xl p-6"
          style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="p-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Shield className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
            </div>
            <h2 className="text-sm font-semibold" style={{ color: '#e5e5e5' }}>About CrimeArch</h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)', lineHeight: '1.7' }}>
            CrimeArch provides real-time crime data visualization and analytics to help you stay informed about safety in your area.
            Access interactive maps, detailed analytics, and stay updated with the latest crime trends.
          </p>
        </div> */}

      </div>
    </div>
  )
}

export default ProfilePage