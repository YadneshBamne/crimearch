import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Eye, EyeOff, ArrowLeft, Shield } from "lucide-react"

// ── Shared style tokens ──────────────────────────────────────────────
const inputStyle = {
  width: '100%', height: '44px', padding: '0 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '10px', color: '#e5e5e5', fontSize: '13px',
  outline: 'none', transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: '600',
  letterSpacing: '0.07em', textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.35)', marginBottom: '6px',
}

const ghostBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
  width: '100%', height: '44px', borderRadius: '10px', fontSize: '13px',
  fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  color: 'rgba(255,255,255,0.55)',
}

const primaryBtn = {
  ...ghostBtn,
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#f1f1f1',
}
// ─────────────────────────────────────────────────────────────────────

function Field({ label, id, children }) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function PasswordInput({ id, name, placeholder, value, onChange, disabled }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id} name={name} type={show ? 'text' : 'password'}
        placeholder={placeholder} value={value} onChange={onChange}
        disabled={disabled} required
        style={{ ...inputStyle, paddingRight: '42px' }}
        onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
      />
      <button
        type="button" onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute', right: 0, top: 0, height: '100%',
          width: '42px', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.3)',
        }}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

export default function AuthPage({ onLogin }) {
  const [currentView, setCurrentView] = useState("login")
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError("")
    if (currentView === "register") {
      if (formData.password !== formData.confirmPassword) return setError("Passwords do not match")
      if (formData.password.length < 6) return setError("Password must be at least 6 characters")
    }
    if (currentView === "forgot") return setError("Password reset coming soon")
    setLoading(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const endpoint = currentView === "login" ? "/api/auth/login" : "/api/auth/register"
      const res = await axios.post(`${API_URL}${endpoint}`, {
        email: formData.email, password: formData.password, name: formData.name,
      })
      if (res.data.success) {
        localStorage.setItem("token", res.data.token)
        localStorage.setItem("user", JSON.stringify(res.data.user))
        onLogin(res.data.user, res.data.token)
        navigate("/")
      }
    } catch (err) {
      setError(err.response?.data?.error || `${currentView === "login" ? "Login" : "Registration"} failed. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  const titles = { login: 'Welcome back', register: 'Create account', forgot: 'Reset password' }
  const subtitles = {
    login: 'Sign in to access crime analytics',
    register: 'Get started with CrimePulse',
    forgot: "We'll send a reset link to your email",
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
            CrimePulse
          </span>
        </div>

        {/* Hero text */}
        <div style={{ position: 'relative' }}>
          <p style={{
            fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)', marginBottom: '16px',
          }}>
            Real-time Intelligence
          </p>
          <h2 style={{
            fontSize: '32px', fontWeight: '700', color: '#f1f1f1',
            lineHeight: 1.25, letterSpacing: '-0.03em', margin: '0 0 16px',
          }}>
            Crime Analytics<br />& Monitoring
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, margin: 0 }}>
            Access comprehensive crime data visualization, pattern detection, and insights to make informed decisions for public safety.
          </p>

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
            {['Live Heatmaps', 'Risk Scoring', 'Patrol Zones'].map(chip => (
              <span key={chip} style={{
                fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)',
                padding: '5px 12px', borderRadius: '999px',
              }}>
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>© 2026 CrimePulse</span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>Privacy Policy</span>
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────────── */}
      <div style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', background: '#0a0a0a',
      }}
        className="lg:w-1/2"
      >
        <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Mobile logo */}
          {/* <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '9px',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={15} color="rgba(255,255,255,0.6)" />
            </div>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#e5e5e5' }}>CrimePulse</span>
          </div> */}

          {/* Header */}
          <div style={{ position: 'relative' }}>
            {currentView === 'forgot' && (
              <button
                onClick={() => setCurrentView('login')}
                style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.35)', display: 'flex', padding: '4px',
                }}
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <h2 style={{
              margin: '0 0 4px', fontSize: '22px', fontWeight: '700',
              color: '#f1f1f1', letterSpacing: '-0.02em',
              textAlign: currentView === 'forgot' ? 'center' : 'left',
            }}>
              {titles[currentView]}
            </h2>
            <p style={{
              margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.35)',
              textAlign: currentView === 'forgot' ? 'center' : 'left',
            }}>
              {subtitles[currentView]}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '10px', fontSize: '12px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentView === 'register' && (
              <Field label="Full Name" id="name">
                <input
                  id="name" name="name" type="text" placeholder="John Doe"
                  value={formData.name} onChange={handleChange}
                  required disabled={loading} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                />
              </Field>
            )}

            <Field label="Email" id="email">
              <input
                id="email" name="email" type="email" placeholder="you@example.com"
                value={formData.email} onChange={handleChange}
                required disabled={loading} style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
              />
            </Field>

            {currentView !== 'forgot' && (
              <Field label="Password" id="password">
                <PasswordInput
                  id="password" name="password" placeholder="Enter password"
                  value={formData.password} onChange={handleChange} disabled={loading}
                />
              </Field>
            )}

            {currentView === 'register' && (
              <Field label="Confirm Password" id="confirmPassword">
                <PasswordInput
                  id="confirmPassword" name="confirmPassword" placeholder="Confirm password"
                  value={formData.confirmPassword} onChange={handleChange} disabled={loading}
                />
              </Field>
            )}

            {currentView === 'login' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ accentColor: '#e5e5e5', width: '13px', height: '13px' }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Remember me</span>
                </label>
                <button
                  type="button" onClick={() => setCurrentView('forgot')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'rgba(255,255,255,0.4)', padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Primary submit */}
            <button
              type="submit" disabled={loading}
              style={{ ...primaryBtn, marginTop: '4px', opacity: loading ? 0.6 : 1 }}
              onMouseOver={e => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              {loading ? 'Processing…' : currentView === 'login' ? 'Sign In' : currentView === 'register' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </form>

          {/* Social auth */}
          {currentView !== 'forgot' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {/* Google */}
                <button
                  type="button" onClick={() => setError('Google sign-in coming soon')}
                  style={ghostBtn}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#e5e5e5' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>

                {/* Apple */}
                <button
                  type="button" onClick={() => setError('Apple sign-in coming soon')}
                  style={ghostBtn}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#e5e5e5' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-.96 3.64-.82 1.57.06 2.75.63 3.54 1.51-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Apple
                </button>
              </div>
            </>
          )}

          {/* View switcher */}
          <p style={{ margin: 0, textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            {currentView === 'login' && <>No account?{' '}
              <button type="button" onClick={() => setCurrentView('register')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', padding: 0 }}>
                Register
              </button>
            </>}
            {currentView === 'register' && <>Have an account?{' '}
              <button type="button" onClick={() => setCurrentView('login')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', padding: 0 }}>
                Sign in
              </button>
            </>}
            {currentView === 'forgot' && <>Remember it?{' '}
              <button type="button" onClick={() => setCurrentView('login')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', padding: 0 }}>
                Back to login
              </button>
            </>}
          </p>

        </div>
      </div>
    </div>
  )
}