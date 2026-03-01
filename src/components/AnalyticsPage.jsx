import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, MapPin, ChevronLeft, TrendingUp, TrendingDown, Menu, X, Shield } from 'lucide-react'

const card = {
  background: '#111111',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '16px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
}

const innerCard = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '10px',
}

const label = {
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.3)',
  marginBottom: '4px',
}

function StatCard({ title, value, color = '#e5e5e5' }) {
  return (
    <div style={{ ...card, padding: '24px' }}>
      <p style={label}>{title}</p>
      <p style={{ fontSize: '36px', fontWeight: '700', color, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
        {value}
      </p>
    </div>
  )
}

function RiskBadge({ score }) {
  const color = score >= 70 ? '#ef4444' : score >= 50 ? '#f97316' : '#fbbf24'
  const bg   = score >= 70 ? 'rgba(239,68,68,0.12)' : score >= 50 ? 'rgba(249,115,22,0.12)' : 'rgba(251,191,36,0.12)'
  return (
    <span style={{
      fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em',
      textTransform: 'uppercase', color, background: bg,
      border: `1px solid ${color}44`, padding: '3px 10px', borderRadius: '999px',
    }}>
      Risk {Math.round(score)}
    </span>
  )
}

function SectionHeader({ icon: Icon, iconColor = 'rgba(255,255,255,0.5)', title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
      <div style={{
        padding: '8px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color={iconColor} />
      </div>
      <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#e5e5e5', letterSpacing: '-0.01em' }}>
        {title}
      </h2>
    </div>
  )
}

function AnalyticsPage({ crimeData, analytics, filteredCrimeData }) {
  const [showDrawer, setShowDrawer] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '32px 16px 128px', color: '#e5e5e5' }}>

      {/* Mobile Drawer Backdrop */}
      {showDrawer && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 9997 }}
          className="md:hidden"
          onClick={() => setShowDrawer(false)}
        />
      )}

      {/* Mobile Toggle FAB */}
      <button
        className="md:hidden"
        onClick={() => setShowDrawer(!showDrawer)}
        aria-label="Toggle Analytics"
        style={{
          position: 'fixed', bottom: '96px', right: '20px', zIndex: 9999,
          width: '52px', height: '52px', borderRadius: '14px',
          background: showDrawer ? '#1a1a1a' : '#1f1f1f',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          color: 'rgba(255,255,255,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        {showDrawer ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <Link
            to="/map"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '500',
              textDecoration: 'none', marginBottom: '24px',
              transition: 'all 0.15s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#e5e5e5' }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          >
            <ChevronLeft size={15} />
            Back to Map
          </Link>

          <h1 style={{ margin: '0 0 6px', fontSize: '32px', fontWeight: '700', color: '#f1f1f1', letterSpacing: '-0.03em' }}>
            Crime Analytics
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
            Pattern detection and risk intelligence
          </p>
        </div>

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          <StatCard title="Total Crimes"    value={crimeData.length}            color="#e5e5e5" />
          <StatCard title="Filtered Crimes" value={filteredCrimeData.length}    color="#e5e5e5" />
          <StatCard title="Hotspots"        value={analytics.hotspots?.length || 0} color="#ef4444" />
        </div>

        {/* Main Content */}
        <div className={`analytics-cards-container ${showDrawer ? 'analytics-drawer-open' : ''}`}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Mobile close */}
          <button
            className="md:hidden"
            onClick={() => setShowDrawer(false)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', padding: '14px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
            }}
          >
            <X size={15} /> Close
          </button>

          {/* Hotspots */}
          {analytics.hotspots?.length > 0 && (
            <div style={{ ...card, padding: '24px' }}>
              <SectionHeader icon={AlertTriangle} iconColor="#ef4444" title="Crime Hotspots" />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {analytics.hotspots.map((hotspot, idx) => (
                  <div
                    key={idx}
                    style={{ ...innerCard, padding: '16px', transition: 'all 0.2s', cursor: 'default' }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
                  >
                    {/* Row 1: rank + name + badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)',
                          width: '26px', height: '26px', borderRadius: '8px',
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#e5e5e5' }}>
                          {hotspot.location}
                        </span>
                      </div>
                      <RiskBadge score={hotspot.risk_score} />
                    </div>

                    {/* Row 2: stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ ...innerCard, padding: '10px 12px' }}>
                        <p style={label}>Crimes</p>
                        <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#e5e5e5' }}>
                          {hotspot.crime_count}
                        </p>
                      </div>
                      <div style={{ ...innerCard, padding: '10px 12px' }}>
                        <p style={label}>Critical</p>
                        <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>
                          {hotspot.critical_crimes}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patterns + Trends */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

            {/* Peak Times */}
            {analytics.patterns && (
              <div style={{ ...card, padding: '24px' }}>
                <SectionHeader icon={Activity} title="Peak Crime Times" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { sublabel: 'Peak Hour', value: `${analytics.patterns.peak_hour}:00`, sub: `${analytics.patterns.peak_hour_count} incidents`, color: '#e5e5e5' },
                    { sublabel: 'Peak Day',  value: analytics.patterns.peak_day,           sub: `${analytics.patterns.peak_day_count} incidents`,  color: '#e5e5e5' },
                  ].map(({ sublabel, value, sub, color }) => (
                    <div key={sublabel} style={{ ...innerCard, padding: '14px 16px' }}>
                      <p style={label}>{sublabel}</p>
                      <p style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: '700', color, letterSpacing: '-0.02em' }}>{value}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 30-day Trend */}
            {analytics.trends && (() => {
              const up = analytics.trends.trend === 'increasing'
              const trendColor = up ? '#ef4444' : '#4ade80'
              const TrendIcon = up ? TrendingUp : TrendingDown
              return (
                <div style={{ ...card, padding: '24px' }}>
                  <SectionHeader icon={TrendingUp} title="30-Day Trend" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ ...innerCard, padding: '14px 16px' }}>
                      <p style={label}>Total Crimes</p>
                      <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#e5e5e5', letterSpacing: '-0.03em' }}>
                        {analytics.trends.total_crimes}
                      </p>
                    </div>
                    <div style={{ ...innerCard, padding: '14px 16px', borderColor: `${trendColor}22` }}>
                      <p style={label}>Direction</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <div style={{
                          padding: '5px', borderRadius: '8px',
                          background: up ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)',
                          display: 'flex',
                        }}>
                          <TrendIcon size={14} color={trendColor} />
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: trendColor, textTransform: 'capitalize' }}>
                          {analytics.trends.trend}
                        </span>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontWeight: '500' }}>
                          {Math.abs(analytics.trends.change_percent)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Patrol Priority Zones */}
          {analytics.patrolRoutes?.length > 0 && (
            <div style={{ ...card, padding: '24px' }}>
              <SectionHeader icon={MapPin} title="Patrol Priority Zones" />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {analytics.patrolRoutes.map((route, idx) => (
                  <div key={idx} style={{
                    ...innerCard, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '12px', transition: 'all 0.2s',
                  }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.6)',
                      }}>
                        {route.priority}
                      </span>
                      <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#e5e5e5' }}>
                          {route.location}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                          {route.crime_count} crimes
                        </p>
                      </div>
                    </div>
                    <RiskBadge score={route.risk_score} />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage