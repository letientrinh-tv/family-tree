import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/client'

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const step = (timestamp) => {
          const progress = Math.min((timestamp - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(eased * target))
          if (progress < 1) requestAnimationFrame(step)
          else setCount(target)
        }
        requestAnimationFrame(step)
      }
    }, { threshold: 0.3 })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return [count, ref]
}

function StatCard({ value, label, icon }) {
  const [count, ref] = useCountUp(value)
  return (
    <div ref={ref} className="text-center p-6">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-4xl font-bold text-primary-500 font-serif">{count.toLocaleString()}+</div>
      <div className="text-bark mt-1 font-medium">{label}</div>
    </div>
  )
}

export default function Home() {
  const { isAuthenticated } = useAuth()
  const [stats, setStats] = useState({ total_users: 1200, total_trees: 450, total_persons: 8700 })
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      apiClient.get('/admin/stats').then(res => setStats(res.data)).catch(() => {})
    }
  }, [isAuthenticated])

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #2D5016 0%, #4a3000 40%, #8B4513 100%)',
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorative elements */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05 }}>
          <div style={{ position: 'absolute', top: '10%', left: '5%', fontSize: '8rem' }}>🌳</div>
          <div style={{ position: 'absolute', bottom: '10%', right: '5%', fontSize: '6rem' }}>🍃</div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '20rem', opacity: 0.3 }}>🌳</div>
        </div>

        {/* Decorative border */}
        <div style={{
          position: 'absolute',
          inset: '20px',
          border: '1px solid rgba(196, 168, 130, 0.3)',
          borderRadius: '4px',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          inset: '24px',
          border: '1px solid rgba(196, 168, 130, 0.15)',
          borderRadius: '4px',
          pointerEvents: 'none',
        }} />

        <div className="text-center px-4 max-w-4xl mx-auto" style={{ position: 'relative', zIndex: 1 }}>
          {/* Ornament */}
          <div style={{ color: '#C4A882', fontSize: '1.5rem', marginBottom: '8px', letterSpacing: '0.5em' }}>
            ❧ ✦ ❧
          </div>

          <h1
            style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              color: '#F5F0E8',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '16px',
              textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            Lưu Giữ Ký Ức
            <br />
            <span style={{ color: '#C4A882' }}>Dòng Họ Việt Nam</span>
          </h1>

          <p
            style={{
              color: '#d4c5a9',
              fontSize: '1.15rem',
              maxWidth: '600px',
              margin: '0 auto 32px',
              lineHeight: 1.8,
              fontFamily: 'Lora, Georgia, serif',
            }}
          >
            Xây dựng và lưu giữ gia phả dòng họ một cách trực quan, dễ dàng.
            Kết nối các thế hệ, bảo tồn ký ức và truyền lại cho con cháu mai sau.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!isAuthenticated ? (
              <>
                <Link
                  to="/register"
                  style={{
                    background: '#8B4513',
                    color: '#F5F0E8',
                    padding: '12px 28px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    textDecoration: 'none',
                    border: '2px solid #C4A882',
                    transition: 'all 0.2s',
                    fontFamily: 'Lora, Georgia, serif',
                  }}
                  onMouseEnter={e => e.target.style.background = '#7a3d11'}
                  onMouseLeave={e => e.target.style.background = '#8B4513'}
                >
                  Bắt Đầu Miễn Phí
                </Link>
                <Link
                  to="/guide"
                  style={{
                    background: 'transparent',
                    color: '#F5F0E8',
                    padding: '12px 28px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    textDecoration: 'none',
                    border: '2px solid rgba(196,168,130,0.6)',
                    transition: 'all 0.2s',
                    fontFamily: 'Lora, Georgia, serif',
                  }}
                >
                  Xem Hướng Dẫn
                </Link>
              </>
            ) : (
              <Link
                to="/dashboard"
                style={{
                  background: '#8B4513',
                  color: '#F5F0E8',
                  padding: '12px 32px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  textDecoration: 'none',
                  border: '2px solid #C4A882',
                  fontFamily: 'Lora, Georgia, serif',
                }}
              >
                Vào Dashboard →
              </Link>
            )}
          </div>

          {/* Bottom ornament */}
          <div style={{ color: '#C4A882', fontSize: '1.2rem', marginTop: '32px', letterSpacing: '0.5em', opacity: 0.7 }}>
            ✦ ✦ ✦
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ background: '#FDFAF5', borderTop: '2px solid #C4A882', borderBottom: '2px solid #C4A882' }}>
        <div className="max-w-5xl mx-auto">
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
            <div style={{ borderRight: isMobile ? 'none' : '1px solid #C4A882', borderBottom: isMobile ? '1px solid #C4A882' : 'none' }}>
              <StatCard value={stats.total_users} label="Người dùng" icon="👨‍👩‍👧‍👦" />
            </div>
            <div style={{ borderRight: isMobile ? 'none' : '1px solid #C4A882', borderBottom: isMobile ? '1px solid #C4A882' : 'none' }}>
              <StatCard value={stats.total_trees} label="Cây gia phả" icon="🌳" />
            </div>
            <div>
              <StatCard value={stats.total_persons} label="Thành viên gia đình" icon="📜" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4" style={{ background: '#F5F0E8' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2
              style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: '2.2rem',
                color: '#3C2415',
                marginBottom: '8px',
              }}
            >
              Tính Năng Nổi Bật
            </h2>
            <div className="ornament-divider max-w-sm mx-auto">
              <span style={{ fontFamily: 'serif', color: '#C4A882' }}>✦</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              {
                icon: '🗂️',
                title: 'Vẽ Sơ Đồ Gia Phả',
                desc: 'Tạo sơ đồ gia phả trực quan với giao diện kéo-thả dễ dàng. Thêm, di chuyển và kết nối các thành viên chỉ với vài cú nhấp chuột.',
                color: '#8B4513',
              },
              {
                icon: '📸',
                title: 'Lưu Trữ Ảnh & Tiểu Sử',
                desc: 'Đính kèm ảnh chân dung, ghi chép tiểu sử, ngày sinh, ngày mất, nghề nghiệp cho từng thành viên trong gia đình.',
                color: '#2D5016',
              },
              {
                icon: '📄',
                title: 'Xuất File PDF / PNG',
                desc: 'Xuất gia phả thành file PDF hoặc ảnh PNG chất lượng cao để in ấn, lưu trữ hoặc chia sẻ với người thân.',
                color: '#4a3000',
              },
            ].map(feature => (
              <div key={feature.title} className="vintage-card p-6 hover:shadow-vintage-lg transition-shadow">
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{feature.icon}</div>
                <h3
                  style={{
                    fontFamily: 'Playfair Display, Georgia, serif',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: feature.color,
                    marginBottom: '8px',
                  }}
                >
                  {feature.title}
                </h3>
                <p style={{ color: '#5a3820', lineHeight: 1.7, fontSize: '0.9rem' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #3C2415 0%, #8B4513 100%)',
          padding: '60px 20px',
          textAlign: 'center',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <h2
            style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '2rem',
              color: '#F5F0E8',
              marginBottom: '12px',
            }}
          >
            Bắt Đầu Hôm Nay
          </h2>
          <p style={{ color: '#d4c5a9', marginBottom: '24px', fontSize: '1rem' }}>
            Gia phả là di sản quý giá nhất của mỗi dòng họ. Hãy bắt đầu lưu giữ ngay hôm nay.
          </p>
          {!isAuthenticated ? (
            <Link
              to="/register"
              style={{
                background: '#F5F0E8',
                color: '#8B4513',
                padding: '12px 32px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '1rem',
                textDecoration: 'none',
                display: 'inline-block',
                fontFamily: 'Lora, Georgia, serif',
              }}
            >
              Đăng Ký Miễn Phí →
            </Link>
          ) : (
            <Link
              to="/dashboard"
              style={{
                background: '#F5F0E8',
                color: '#8B4513',
                padding: '12px 32px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '1rem',
                textDecoration: 'none',
                display: 'inline-block',
                fontFamily: 'Lora, Georgia, serif',
              }}
            >
              Xem Gia Phả Của Tôi →
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#3C2415', color: '#d4c5a9', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.1rem', marginBottom: '8px' }}>
          🌳 Gia Phả Việt
        </div>
        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
          © 2024 Gia Phả Việt. Lưu giữ ký ức dòng họ Việt Nam.
        </div>
      </footer>
    </div>
  )
}
