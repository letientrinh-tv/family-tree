import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import apiClient from '../api/client'

const TEMPLATES = [
  {
    id: 'truyen_thong',
    name: 'Truyền thống',
    desc: 'Hoa văn dân tộc Việt Nam',
    primary: '#8B4513', border: '#C4A882', bg: '#FDF8F0', accent: '#D4A017',
  },
  {
    id: 'thien_nhien',
    name: 'Thiên nhiên',
    desc: 'Tre xanh, lá cây tự nhiên',
    primary: '#2D5016', border: '#4a7c2a', bg: '#F0F8EC', accent: '#6B9E45',
  },
  {
    id: 'hoang_gia',
    name: 'Hoàng gia',
    desc: 'Phong cách cung đình hoàng gia',
    primary: '#7c5c00', border: '#c9a227', bg: '#FFF8E8', accent: '#c9a227',
  },
  {
    id: 'hien_dai',
    name: 'Hiện đại',
    desc: 'Thiết kế tối giản, sang trọng',
    primary: '#1a1a2e', border: '#3a3a5c', bg: '#F8F8FC', accent: '#6c63ff',
  },
]

const SIZES = [
  { id: 'A3', label: 'A3', desc: '29.7 × 42 cm' },
  { id: 'A2', label: 'A2', desc: '42 × 59.4 cm' },
  { id: 'A1', label: 'A1', desc: '59.4 × 84.1 cm' },
]

const STATUS_MAP = {
  pending:   { label: 'Chờ xác nhận', color: '#b45309', bg: '#fef3c7' },
  confirmed: { label: 'Đã xác nhận',  color: '#1d4ed8', bg: '#dbeafe' },
  printing:  { label: 'Đang in',      color: '#7c3aed', bg: '#ede9fe' },
  shipped:   { label: 'Đang giao',    color: '#0891b2', bg: '#cffafe' },
  done:      { label: 'Hoàn thành',   color: '#166534', bg: '#dcfce7' },
  cancelled: { label: 'Đã hủy',       color: '#991b1b', bg: '#fee2e2' },
}

function CornerOrnament({ color, size = 40, flip = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none"
      style={{ transform: flip, display: 'block' }}>
      <path d="M2 38 L2 8 Q2 2 8 2 L38 2" stroke={color} strokeWidth="2.5" fill="none" />
      <path d="M2 38 L2 14 Q2 6 10 6 L38 6" stroke={color} strokeWidth="1" strokeOpacity="0.4" fill="none" />
      <circle cx="8" cy="8" r="3.5" fill={color} opacity="0.9" />
      <circle cx="4" cy="4" r="1.5" fill={color} opacity="0.5" />
    </svg>
  )
}

function FramePreview({ templateId, treeImage, treeName, width = 280, height = 200 }) {
  const t = TEMPLATES.find(x => x.id === templateId) || TEMPLATES[0]
  const bw = 14
  return (
    <div style={{
      width, height, position: 'relative', boxSizing: 'border-box',
      border: `${bw}px solid ${t.border}`,
      outline: `2px solid ${t.accent}`, outlineOffset: '-3px',
      background: t.bg, borderRadius: 3, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Corners */}
      <div style={{ position: 'absolute', top: -2, left: -2, zIndex: 2 }}>
        <CornerOrnament color={t.accent} size={34} />
      </div>
      <div style={{ position: 'absolute', top: -2, right: -2, zIndex: 2 }}>
        <CornerOrnament color={t.accent} size={34} flip="scaleX(-1)" />
      </div>
      <div style={{ position: 'absolute', bottom: -2, left: -2, zIndex: 2 }}>
        <CornerOrnament color={t.accent} size={34} flip="scaleY(-1)" />
      </div>
      <div style={{ position: 'absolute', bottom: -2, right: -2, zIndex: 2 }}>
        <CornerOrnament color={t.accent} size={34} flip="scale(-1)" />
      </div>

      {/* Top title */}
      <div style={{
        flexShrink: 0, textAlign: 'center', padding: '3px 8px',
        background: t.accent + '20', borderBottom: `1px solid ${t.border}`,
        fontFamily: 'Playfair Display, Georgia, serif',
        fontSize: '0.6rem', fontWeight: 700, color: t.primary, letterSpacing: '0.06em',
      }}>
        {treeName || 'GIA PHẢ DÒNG HỌ'}
      </div>

      {/* Tree image */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F0E8' }}>
        {treeImage
          ? <img src={treeImage} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="family tree" />
          : <div style={{ color: t.border, fontSize: '0.68rem', textAlign: 'center', padding: 6 }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 3 }}>🌳</div>
              Sơ đồ gia phả
            </div>
        }
      </div>

      {/* Bottom */}
      <div style={{
        flexShrink: 0, textAlign: 'center', padding: '2px 8px',
        background: t.accent + '15', borderTop: `1px solid ${t.border}`,
        fontSize: '0.5rem', color: t.accent, letterSpacing: '0.1em',
      }}>
        GIA PHẢ VIỆT · GIA PHẢ DÒNG HỌ
      </div>
    </div>
  )
}

export default function PrintOrderModal({ onClose, treeId, treeName, getTreeImage }) {
  const [step, setStep] = useState(1)
  const [template, setTemplate] = useState('truyen_thong')
  const [size, setSize] = useState('A2')
  const [treeImage, setTreeImage] = useState(null)
  const [loadingImage, setLoadingImage] = useState(false)
  const [form, setForm] = useState({ recipient_name: '', phone: '', address: '', city: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  useEffect(() => {
    if (step === 2 && !treeImage) {
      setLoadingImage(true)
      getTreeImage()
        .then(url => setTreeImage(url))
        .catch(() => {})
        .finally(() => setLoadingImage(false))
    }
  }, [step])

  const handleSubmit = async () => {
    if (!form.recipient_name.trim()) { toast.error('Vui lòng nhập tên người nhận'); return }
    if (!form.phone.trim()) { toast.error('Vui lòng nhập số điện thoại'); return }
    if (!form.address.trim()) { toast.error('Vui lòng nhập địa chỉ'); return }
    if (!form.city.trim()) { toast.error('Vui lòng nhập tỉnh/thành phố'); return }
    setSubmitting(true)
    try {
      await apiClient.post('/print-orders', { tree_id: treeId, tree_name: treeName, template, size, ...form })
      setSubmitted(true)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gửi đơn thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const lblS = { display: 'block', fontSize: '0.78rem', color: '#7a5c3e', fontWeight: 700, marginBottom: 4 }
  const inpS = { width: '100%', padding: '8px 10px', border: '1px solid #C4A882', borderRadius: 6, background: '#FDFAF5', color: '#3C2415', fontFamily: 'Lora,Georgia,serif', fontSize: '0.88rem', boxSizing: 'border-box' }
  const tpl = TEMPLATES.find(t => t.id === template)
  const sz = SIZES.find(s => s.id === size)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(60,36,21,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: '100%', maxWidth: submitted ? 460 : (isMobile ? '100%' : 800), background: '#FDFAF5', borderRadius: isMobile ? 0 : 14, border: '1px solid #C4A882', boxShadow: '0 8px 32px rgba(60,36,21,0.25)', fontFamily: 'Lora,Georgia,serif', maxHeight: isMobile ? '100dvh' : '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #E8E0D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display,Georgia,serif', fontSize: '1.25rem', color: '#3C2415', margin: 0 }}>🖨 In tranh gia phả</h2>
            {!submitted && (
              <p style={{ color: '#7a5c3e', fontSize: '0.8rem', margin: '3px 0 0' }}>
                {step === 1 ? 'Bước 1/2 — Chọn khung tranh & kích thước' : 'Bước 2/2 — Xem trước & thông tin nhận hàng'}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#8B4513', cursor: 'pointer', lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* ── Success ── */}
          {submitted && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>✅</div>
              <h3 style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#2D5016', fontSize: '1.25rem', marginBottom: 8 }}>Đặt hàng thành công!</h3>
              <p style={{ color: '#7a5c3e', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: 16 }}>
                Chúng tôi đã nhận đơn hàng của bạn.<br />
                Admin sẽ liên hệ xác nhận trong vòng <strong>24 giờ</strong>.
              </p>
              <div style={{ margin: '0 auto 20px', maxWidth: 340, background: '#F5F0E8', borderRadius: 10, padding: '14px 18px', border: '1px solid #C4A882', textAlign: 'left', fontSize: '0.85rem', lineHeight: 1.8 }}>
                {[
                  ['Khung', tpl?.name],
                  ['Kích thước', `${sz?.label} (${sz?.desc})`],
                  ['Người nhận', form.recipient_name],
                  ['Điện thoại', form.phone],
                  ['Địa chỉ', `${form.address}, ${form.city}`],
                  form.notes && ['Ghi chú', form.notes],
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#9a7c60', minWidth: 90, flexShrink: 0 }}>{k}:</span>
                    <span style={{ color: '#3C2415', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={onClose} className="btn-primary" style={{ padding: '9px 28px' }}>Đóng</button>
            </div>
          )}

          {/* ── Step 1: Template + size ── */}
          {!submitted && step === 1 && (
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7a5c3e', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Chọn khung tranh</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 14, marginBottom: 22 }}>
                {TEMPLATES.map(t => (
                  <div key={t.id}
                    onClick={() => setTemplate(t.id)}
                    style={{
                      cursor: 'pointer', borderRadius: 10,
                      border: `2px solid ${template === t.id ? t.primary : '#C4A882'}`,
                      padding: 12, background: template === t.id ? t.bg : '#FDFAF5',
                      transition: 'all 0.15s',
                      boxShadow: template === t.id ? `0 2px 12px ${t.primary}30` : 'none',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                      <FramePreview templateId={t.id} treeImage={null} treeName={treeName} width={220} height={148} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {template === t.id && <span style={{ color: t.primary, fontWeight: 700 }}>✓</span>}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: t.primary }}>{t.name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#7a5c3e' }}>{t.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7a5c3e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Kích thước in</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {SIZES.map(s => (
                  <button key={s.id} type="button" onClick={() => setSize(s.id)}
                    style={{
                      flex: 1, padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${size === s.id ? '#8B4513' : '#C4A882'}`,
                      background: size === s.id ? '#8B4513' : '#FDFAF5',
                      color: size === s.id ? '#F5F0E8' : '#3C2415',
                      fontFamily: 'Lora,Georgia,serif', fontWeight: 700, transition: 'all 0.15s',
                    }}>
                    <div style={{ fontSize: '1rem' }}>{s.label}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.85, marginTop: 2 }}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Preview + form ── */}
          {!submitted && step === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
              {/* Preview */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7a5c3e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Xem trước khung tranh</div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  {loadingImage
                    ? <div style={{ width: 280, height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F0E8', border: '1px solid #C4A882', borderRadius: 4, flexDirection: 'column', gap: 8 }}>
                        <div className="spinner" />
                        <span style={{ fontSize: '0.75rem', color: '#9a7c60' }}>Đang tải sơ đồ...</span>
                      </div>
                    : <FramePreview templateId={template} treeImage={treeImage} treeName={treeName} width={280} height={210} />
                  }
                </div>
                <div style={{ background: '#F5F0E8', borderRadius: 8, padding: '10px 14px', border: '1px solid #C4A882', fontSize: '0.8rem', color: '#5a3820', lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, color: '#3C2415' }}>Thông tin đơn hàng</div>
                  <div>Khung: <strong>{tpl?.name}</strong></div>
                  <div>Kích thước: <strong>{sz?.label} ({sz?.desc})</strong></div>
                  <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#9a7c60', fontStyle: 'italic' }}>
                    In ấn chất lượng cao, giao hàng toàn quốc.<br />Admin sẽ báo giá sau khi xác nhận đơn.
                  </div>
                </div>
              </div>

              {/* Form */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7a5c3e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Thông tin nhận hàng</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={lblS}>Tên người nhận *</label>
                    <input style={inpS} value={form.recipient_name} onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))} placeholder="Nguyễn Văn A" />
                  </div>
                  <div>
                    <label style={lblS}>Số điện thoại *</label>
                    <input style={inpS} type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0912 345 678" />
                  </div>
                  <div>
                    <label style={lblS}>Địa chỉ *</label>
                    <input style={inpS} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Đường ABC, Phường XYZ" />
                  </div>
                  <div>
                    <label style={lblS}>Tỉnh / Thành phố *</label>
                    <input style={inpS} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Hà Nội" />
                  </div>
                  <div>
                    <label style={lblS}>Ghi chú</label>
                    <textarea style={{ ...inpS, height: 72, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Yêu cầu đặc biệt, thời gian giao..." />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid #E8E0D0', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
            {step === 2 && (
              <button onClick={() => setStep(1)} style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid #C4A882', background: 'transparent', color: '#8B4513', fontFamily: 'Lora,Georgia,serif', fontWeight: 600, cursor: 'pointer' }}>
                ← Quay lại
              </button>
            )}
            {step === 1
              ? <button onClick={() => setStep(2)} className="btn-primary" style={{ padding: '8px 24px' }}>Tiếp theo →</button>
              : <button onClick={handleSubmit} disabled={submitting} className="btn-primary" style={{ padding: '8px 24px', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Đang gửi...' : '📦 Đặt in tranh'}
                </button>
            }
          </div>
        )}
      </div>
    </div>
  )
}

export { STATUS_MAP, TEMPLATES }
