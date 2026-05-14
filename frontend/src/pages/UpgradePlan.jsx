import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'

const PLAN_VISUALS = {
  free:     { bg: '#f9fafb', border: '#d1d5db', icon: '🆓' },
  basic:    { bg: '#f0fdf4', border: '#86efac', icon: '⭐' },
  standard: { bg: '#eff6ff', border: '#93c5fd', icon: '🌟' },
  premium:  { bg: '#fffbeb', border: '#fcd34d', icon: '👑' },
}

const DEFAULT_PLANS = {
  free:     { label: 'Miễn phí',   price: 0,       trees: 1, members: 30,   color: '#6b7280', ...PLAN_VISUALS.free },
  basic:    { label: 'Cơ bản',     price: 300000,  trees: 1, members: 200,  color: '#2D5016', ...PLAN_VISUALS.basic },
  standard: { label: 'Tiêu chuẩn', price: 500000,  trees: 1, members: 1000, color: '#1d4ed8', ...PLAN_VISUALS.standard },
  premium:  { label: 'Cao cấp',    price: 1000000, trees: 3, members: 2000, color: '#92400e', ...PLAN_VISUALS.premium },
}

const PAID_PLANS = ['basic', 'standard', 'premium']

function fmtMoney(n) {
  return n.toLocaleString('vi-VN') + ' ₫'
}

function fmtDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Fake QR code SVG pattern
function FakeQR({ size = 120 }) {
  const cells = []
  const grid = [
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,1,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,1,0,0,1,0,1,1,0,1,1,0,1],
    [0,1,0,0,1,0,0,0,1,1,0,1,0,0,1,0,0,1,0],
    [1,0,1,1,0,1,1,1,0,0,1,0,1,1,0,1,1,0,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,0,0,1,0,0,1,0],
    [1,1,1,1,1,1,1,0,0,0,1,0,1,0,1,1,0,1,1],
    [1,0,0,0,0,0,1,0,1,1,0,1,0,1,0,0,1,0,0],
    [1,0,1,1,1,0,1,0,0,0,1,0,1,0,1,1,0,1,1],
    [1,0,1,1,1,0,1,0,1,1,0,1,0,1,0,0,1,0,0],
    [1,0,1,1,1,0,1,0,0,0,1,0,1,0,1,1,0,1,1],
    [1,0,0,0,0,0,1,0,1,1,0,1,0,1,0,0,1,0,0],
    [1,1,1,1,1,1,1,0,0,0,1,0,1,0,1,1,0,1,1],
  ]
  const cellSize = size / grid.length
  grid.forEach((row, r) => {
    row.forEach((val, c) => {
      if (val) {
        cells.push(<rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="#1a1a1a" />)
      }
    })
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <rect width={size} height={size} fill="white" />
      {cells}
    </svg>
  )
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button onClick={copy} style={{
      padding: '2px 8px', fontSize: '0.72rem', borderRadius: 4, border: '1px solid #C4A882',
      background: copied ? '#2D5016' : '#F5F0E8', color: copied ? 'white' : '#8B4513',
      cursor: 'pointer', fontFamily: 'Lora, Georgia, serif', fontWeight: 600,
      transition: 'all 0.2s',
    }}>
      {copied ? '✓ Đã chép' : '📋 Chép'}
    </button>
  )
}

function PaymentModal({ plan, user, onClose, onSuccess, plans }) {
  const p = plans[plan] || DEFAULT_PLANS[plan] || DEFAULT_PLANS.free
  const [tab, setTab] = useState('qr')
  const [confirming, setConfirming] = useState(false)
  const transferContent = `NANGCAP ${user?.username?.toUpperCase()} ${plan.toUpperCase()}`
  const bankAccount = '1234 5678 9012'
  const bankName = 'Vietcombank'
  const accountName = 'NGUYEN VAN A'

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      const res = await apiClient.post('/billing/upgrade', { plan })
      onSuccess(res.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Nâng cấp thất bại')
      setConfirming(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(60,36,21,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: window.innerWidth < 768 ? '100%' : 480, background: '#FDFAF5',
        borderRadius: window.innerWidth < 768 ? 0 : 12, border: '1px solid #C4A882',
        fontFamily: 'Lora, Georgia, serif', overflow: 'hidden',
        maxHeight: '100dvh', overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(60,36,21,0.3)',
      }}>
        {/* Header */}
        <div style={{ background: '#8B4513', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#F5EFE4', fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.1rem', fontWeight: 700 }}>
              Thanh toán gói {p.label}
            </div>
            <div style={{ color: '#d4c5a9', fontSize: '0.82rem', marginTop: 2 }}>
              Có hiệu lực 12 tháng kể từ ngày thanh toán
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#F5F0E8', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Order summary */}
        <div style={{ padding: '14px 20px', background: p.bg, borderBottom: `2px solid ${p.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '1.5rem', marginRight: 8 }}>{p.icon}</span>
              <span style={{ fontWeight: 700, color: p.color, fontSize: '1rem' }}>{p.label}</span>
              <span style={{ fontSize: '0.78rem', color: '#7a5c3e', marginLeft: 8 }}>
                · {p.trees} cây · {(p.members ?? 0).toLocaleString()} TV/cây · 12 tháng
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.2rem', color: p.color }}>{fmtMoney(p.price)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E8E0D0' }}>
          {[{ k: 'qr', l: '📱 Quét QR' }, { k: 'bank', l: '🏦 Chuyển khoản' }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              flex: 1, padding: '10px', border: 'none', borderBottom: `2px solid ${tab === t.k ? '#8B4513' : 'transparent'}`,
              background: 'transparent', color: tab === t.k ? '#8B4513' : '#9a7c60',
              fontFamily: 'Lora, Georgia, serif', fontWeight: tab === t.k ? 700 : 400,
              fontSize: '0.85rem', cursor: 'pointer',
            }}>{t.l}</button>
          ))}
        </div>

        <div style={{ padding: '20px' }}>
          {tab === 'qr' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.82rem', color: '#7a5c3e', marginBottom: 12 }}>
                Quét mã QR bằng app ngân hàng để chuyển khoản
              </div>
              <div style={{
                display: 'inline-block', padding: 12, background: 'white',
                border: '3px solid #8B4513', borderRadius: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)', marginBottom: 12,
              }}>
                <FakeQR size={140} />
              </div>
              <div style={{
                background: '#F5F0E8', borderRadius: 8, padding: '10px 16px',
                border: '1px solid #C4A882', fontSize: '0.82rem', color: '#3C2415',
                textAlign: 'left', lineHeight: 1.8,
              }}>
                <div><strong>Số tiền:</strong> <span style={{ color: '#b91c1c', fontWeight: 700 }}>{fmtMoney(p.price)}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span><strong>Nội dung:</strong> {transferContent}</span>
                  <CopyBtn text={transferContent} />
                </div>
              </div>
            </div>
          )}

          {tab === 'bank' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Ngân hàng', value: bankName },
                { label: 'Số tài khoản', value: bankAccount },
                { label: 'Chủ tài khoản', value: accountName },
                { label: 'Số tiền', value: fmtMoney(p.price), highlight: true },
                { label: 'Nội dung CK', value: transferContent, copy: true },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', background: '#F5F0E8', borderRadius: 6,
                  border: '1px solid #E8E0D0',
                }}>
                  <span style={{ fontSize: '0.78rem', color: '#7a5c3e', fontWeight: 600, minWidth: 110 }}>{row.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: '0.88rem', fontWeight: row.highlight ? 700 : 500,
                      color: row.highlight ? '#b91c1c' : '#3C2415',
                    }}>{row.value}</span>
                    {row.copy && <CopyBtn text={row.value} />}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 18, padding: '10px 14px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fcd34d', fontSize: '0.78rem', color: '#92400e' }}>
            ⚠️ Sau khi chuyển khoản, nhấn <strong>"Xác nhận đã thanh toán"</strong> để kích hoạt gói ngay lập tức. Gói sẽ có hiệu lực trong <strong>365 ngày</strong>.
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '10px', background: '#F5F0E8', color: '#3C2415',
              border: '1px solid #C4A882', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'Lora, Georgia, serif', fontSize: '0.88rem',
            }}>Hủy</button>
            <button onClick={handleConfirm} disabled={confirming} style={{
              flex: 2, padding: '10px', background: confirming ? '#7a3d11' : '#2D5016',
              color: 'white', border: 'none', borderRadius: 6, cursor: confirming ? 'wait' : 'pointer',
              fontFamily: 'Lora, Georgia, serif', fontWeight: 700, fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              {confirming && <span className="spinner" style={{ width: 16, height: 16 }} />}
              {confirming ? 'Đang kích hoạt...' : '✅ Xác nhận đã thanh toán'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UpgradePlan() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [success, setSuccess] = useState(false)
  const [activatedPlan, setActivatedPlan] = useState(null)
  const [PLANS, setPlans] = useState(DEFAULT_PLANS)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  useEffect(() => {
    apiClient.get('/billing/plans').then(res => {
      const merged = {}
      for (const [key, val] of Object.entries(res.data)) {
        const visual = PLAN_VISUALS[key] || {}
        merged[key] = {
          label: val.label,
          price: val.price,
          trees: val.trees,
          members: val.members_per_tree,
          color: val.color || DEFAULT_PLANS[key]?.color || '#6b7280',
          ...visual,
        }
      }
      setPlans(prev => ({ ...prev, ...merged }))
    }).catch(() => {})
  }, [])

  const currentPlan = PLANS[user?.plan] || PLANS.free
  const isExpired = user?.plan_expires_at && new Date(user.plan_expires_at) < new Date()

  const handleSuccess = async (updatedUser) => {
    setSelectedPlan(null)
    setActivatedPlan(updatedUser.plan)
    setSuccess(true)
    await refreshUser()
    toast.success(`Kích hoạt gói ${PLANS[updatedUser.plan]?.label} thành công!`)
  }

  if (success) {
    const ap = PLANS[activatedPlan] || PLANS.free
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{
          maxWidth: 440, width: '100%', background: '#FDFAF5', borderRadius: 16,
          border: '2px solid #86efac', padding: 40, textAlign: 'center',
          boxShadow: '0 8px 32px rgba(45,80,22,0.15)', fontFamily: 'Lora, Georgia, serif',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.5rem', color: '#2D5016', marginBottom: 8 }}>
            Kích hoạt thành công!
          </h2>
          <p style={{ color: '#7a5c3e', marginBottom: 20, fontSize: '0.9rem' }}>
            Gói <strong style={{ color: ap.color }}>{ap.label}</strong> đã được kích hoạt cho tài khoản <strong>{user?.username}</strong>.
            Có hiệu lực đến <strong>{fmtDate(new Date(Date.now() + 365 * 24 * 3600 * 1000))}</strong>.
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24,
            background: ap.bg, borderRadius: 10, padding: 16, border: `1px solid ${ap.border}`,
          }}>
            {[
              ['🌳 Cây gia phả', `${ap.trees} cây`],
              ['👥 Thành viên/cây', ap.members.toLocaleString()],
              ['📅 Thời hạn', '12 tháng'],
              ['💰 Đã thanh toán', fmtMoney(ap.price)],
            ].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#7a5c3e' }}>{l}</div>
                <div style={{ fontWeight: 700, color: ap.color, fontSize: '0.95rem' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('/dashboard')} style={{
              flex: 1, padding: '10px', background: '#8B4513', color: 'white',
              border: 'none', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'Lora, Georgia, serif', fontWeight: 700, fontSize: '0.9rem',
            }}>Về Dashboard</button>
            <button onClick={() => { setSuccess(false); setActivatedPlan(null) }} style={{
              flex: 1, padding: '10px', background: '#F5F0E8', color: '#3C2415',
              border: '1px solid #C4A882', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'Lora, Georgia, serif', fontSize: '0.9rem',
            }}>Xem lại gói</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: '#F5F0E8', fontFamily: 'Lora, Georgia, serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #3C2415 0%, #8B4513 100%)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.8rem', color: '#F5F0E8', margin: '0 0 6px' }}>
            💎 Nâng Cấp Gói Dịch Vụ
          </h1>
          <p style={{ color: '#d4c5a9', fontSize: '0.9rem', margin: 0 }}>
            Mở rộng giới hạn và lưu giữ trọn vẹn gia phả dòng họ
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px' }}>

        {/* Print order banner */}
        <div style={{
          background: 'linear-gradient(135deg, #3C2415 0%, #8B4513 50%, #a0522d 100%)',
          borderRadius: 14, padding: '20px 24px', marginBottom: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 14,
          boxShadow: '0 6px 24px rgba(139,69,19,0.35)',
          border: '1px solid #fcd34d',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: '2.8rem', lineHeight: 1 }}>🖼️</div>
            <div>
              <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.15rem', fontWeight: 700, color: '#fcd34d' }}>
                Đặt in tranh gia phả khổ lớn
              </div>
              <div style={{ color: '#F5EFE4', fontSize: '0.82rem', marginTop: 4, maxWidth: 420, lineHeight: 1.5 }}>
                In gia phả trên vải canvas, giấy mỹ thuật hoặc gỗ khắc — làm quà tặng ý nghĩa cho cả dòng họ.
              </div>
            </div>
          </div>
          <a
            href="/dashboard"
            onClick={e => { e.preventDefault(); navigate('/dashboard') }}
            style={{
              background: '#fcd34d', color: '#3C2415', fontFamily: 'Playfair Display, Georgia, serif',
              fontWeight: 700, fontSize: '0.9rem', padding: '10px 22px',
              borderRadius: 8, border: 'none', cursor: 'pointer', textDecoration: 'none',
              whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              display: 'inline-block',
            }}
          >
            📋 Đặt in ngay →
          </a>
        </div>

        {/* Current plan status */}
        <div style={{
          background: '#FDFAF5', border: `2px solid ${currentPlan.border}`,
          borderRadius: 12, padding: '18px 22px', marginBottom: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, boxShadow: '2px 2px 8px rgba(60,36,21,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: '2rem' }}>{currentPlan.icon}</span>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#7a5c3e', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Gói hiện tại</div>
              <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.2rem', fontWeight: 700, color: currentPlan.color }}>
                {currentPlan.label}
              </div>
              {user?.plan !== 'free' && user?.plan_expires_at && (
                <div style={{ fontSize: '0.78rem', color: isExpired ? '#b91c1c' : '#2D5016', marginTop: 2 }}>
                  {isExpired ? '⚠️ Đã hết hạn' : `✓ Còn hiệu lực đến ${fmtDate(user.plan_expires_at)}`}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              ['🌳', `${currentPlan.trees} cây`, 'Số cây gia phả'],
              ['👥', `${currentPlan.members.toLocaleString()}`, 'Thành viên/cây'],
              ['💰', currentPlan.price === 0 ? 'Miễn phí' : fmtMoney(currentPlan.price) + '/năm', 'Giá'],
            ].map(([icon, val, lbl]) => (
              <div key={lbl} style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: '1.1rem' }}>{icon}</div>
                <div style={{ fontWeight: 700, color: '#3C2415', fontSize: '0.9rem' }}>{val}</div>
                <div style={{ fontSize: '0.68rem', color: '#9a7c60' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#3C2415', marginBottom: 18, fontSize: '1.2rem' }}>
          Chọn gói phù hợp
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
          {PAID_PLANS.map(key => {
            const p = PLANS[key]
            const isCurrent = user?.plan === key
            const isPopular = key === 'standard'

            return (
              <div key={key} style={{
                background: isCurrent ? p.bg : '#FDFAF5',
                border: `2px solid ${isCurrent ? p.color : p.border}`,
                borderRadius: 12,
                padding: '22px',
                position: 'relative',
                boxShadow: isCurrent ? `0 4px 16px ${p.color}30` : '2px 2px 8px rgba(60,36,21,0.12)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={e => { if (!isCurrent) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(60,36,21,0.18)' } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isCurrent ? `0 4px 16px ${p.color}30` : '2px 2px 8px rgba(60,36,21,0.12)' }}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: '#1d4ed8', color: 'white', fontSize: '0.72rem', fontWeight: 700,
                    padding: '3px 14px', borderRadius: 20, whiteSpace: 'nowrap',
                  }}>🔥 Phổ biến nhất</div>
                )}
                {isCurrent && (
                  <div style={{
                    position: 'absolute', top: -12, right: 16,
                    background: p.color, color: 'white', fontSize: '0.72rem', fontWeight: 700,
                    padding: '3px 12px', borderRadius: 20,
                  }}>✓ Đang dùng</div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: '2rem' }}>{p.icon}</span>
                  <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: p.color, marginTop: 4 }}>
                    {p.label}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#3C2415' }}>{fmtMoney(p.price)}</span>
                    <span style={{ fontSize: '0.78rem', color: '#7a5c3e' }}> / năm</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#9a7c60', marginTop: 2 }}>
                    ≈ {Math.round(p.price / 12).toLocaleString('vi-VN')} ₫/tháng
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20 }}>
                  {[
                    `🌳 ${p.trees} cây gia phả`,
                    `👥 ${p.members.toLocaleString()} thành viên/cây`,
                    '📤 Xuất PNG & PDF',
                    '🔔 Nhắc nhở sinh nhật/ngày giỗ',
                    '🌐 Đăng nhập mạng xã hội',
                    ...(key === 'premium' ? ['⭐ Ưu tiên hỗ trợ', '🎨 Giao diện cao cấp'] : []),
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#3C2415' }}>
                      {f}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => !isCurrent && setSelectedPlan(key)}
                  disabled={isCurrent}
                  style={{
                    width: '100%', padding: '10px',
                    background: isCurrent ? '#e5e7eb' : p.color,
                    color: isCurrent ? '#9ca3af' : 'white',
                    border: 'none', borderRadius: 8,
                    fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, fontSize: '0.9rem',
                    cursor: isCurrent ? 'default' : 'pointer',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  {isCurrent ? '✓ Gói đang dùng' : `Chọn gói ${p.label}`}
                </button>
              </div>
            )
          })}
        </div>

        {/* Comparison table */}
        <div style={{ background: '#FDFAF5', border: '1px solid #C4A882', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ background: '#8B4513', padding: '12px 20px' }}>
            <h3 style={{ color: '#F5F0E8', fontFamily: 'Playfair Display, Georgia, serif', margin: 0, fontSize: '1rem' }}>
              So sánh các gói
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F5EFE4' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', color: '#5a3820', fontWeight: 700, borderBottom: '1px solid #C4A882' }}>Tính năng</th>
                  {Object.entries(PLANS).map(([k, p]) => (
                    <th key={k} style={{
                      padding: '10px 16px', textAlign: 'center', color: p.color,
                      fontWeight: 700, borderBottom: '1px solid #C4A882',
                      background: user?.plan === k ? p.bg : undefined,
                    }}>
                      {p.icon} {p.label}
                      {user?.plan === k && <div style={{ fontSize: '0.65rem', fontWeight: 400 }}>▲ Hiện tại</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Số cây gia phả', p => `${p.trees} cây`],
                  ['Thành viên/cây', p => p.members.toLocaleString()],
                  ['Xuất PNG/PDF', () => '✓'],
                  ['Nhắc nhở ngày lễ', p => p.price > 0 ? '✓' : '✗'],
                  ['Đăng nhập MXH', p => p.price > 0 ? '✓' : '✗'],
                  ['Giá/năm', p => p.price === 0 ? 'Miễn phí' : fmtMoney(p.price)],
                ].map(([label, fn], idx) => (
                  <tr key={label} style={{ background: idx % 2 === 0 ? '#FDFAF5' : '#F9F5EE' }}>
                    <td style={{ padding: '9px 16px', color: '#5a3820', fontWeight: 600, borderBottom: '1px solid #F0E8D8' }}>{label}</td>
                    {Object.entries(PLANS).map(([k, p]) => (
                      <td key={k} style={{
                        padding: '9px 16px', textAlign: 'center', borderBottom: '1px solid #F0E8D8',
                        color: fn(p) === '✗' ? '#9ca3af' : '#3C2415',
                        background: user?.plan === k ? PLANS[k].bg : undefined,
                      }}>
                        {fn(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ background: '#FDFAF5', border: '1px solid #C4A882', borderRadius: 10, padding: '18px 22px', fontSize: '0.85rem', color: '#5a3820' }}>
          <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#3C2415', margin: '0 0 12px', fontSize: '0.95rem' }}>❓ Câu hỏi thường gặp</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Thanh toán như thế nào?', 'Chuyển khoản ngân hàng hoặc quét mã QR. Sau khi thanh toán, nhấn xác nhận để kích hoạt ngay.'],
              ['Gói có gia hạn tự động không?', 'Không. Gói sẽ hết hạn sau 12 tháng và bạn có thể gia hạn thủ công.'],
              ['Nâng cấp giữa chừng có được không?', 'Có, bạn có thể nâng lên gói cao hơn bất kỳ lúc nào. Thời hạn sẽ được tính từ ngày nâng cấp.'],
              ['Dữ liệu có bị mất khi hết hạn?', 'Không. Dữ liệu được giữ nguyên, chỉ giới hạn thêm thành viên mới cho đến khi gia hạn.'],
            ].map(([q, a]) => (
              <div key={q}>
                <div style={{ fontWeight: 700, color: '#3C2415', marginBottom: 2 }}>▸ {q}</div>
                <div style={{ color: '#7a5c3e', paddingLeft: 14, lineHeight: 1.5 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          user={user}
          onClose={() => setSelectedPlan(null)}
          onSuccess={handleSuccess}
          plans={PLANS}
        />
      )}
    </div>
  )
}
