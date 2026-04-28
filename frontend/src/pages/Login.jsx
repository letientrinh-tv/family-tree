import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import SocialLoginButtons from '../components/SocialLoginButtons'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      toast.error('Vui lòng nhập đầy đủ thông tin')
      return
    }
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Đăng nhập thành công!')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Đăng nhập thất bại'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        background: '#F5F0E8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🌳</div>
          <h1
            style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '2rem',
              fontWeight: 700,
              color: '#3C2415',
              marginBottom: '4px',
            }}
          >
            Đăng Nhập
          </h1>
          <p style={{ color: '#7a5c3e', fontSize: '0.9rem' }}>
            Chào mừng trở lại, Gia Phả Việt
          </p>
        </div>

        {/* Card */}
        <div
          className="vintage-card"
          style={{ padding: '32px', background: '#FDFAF5' }}
        >
          {/* Decorative top border */}
          <div
            style={{
              height: '4px',
              background: 'linear-gradient(to right, #C4A882, #8B4513, #C4A882)',
              borderRadius: '2px',
              marginBottom: '24px',
            }}
          />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="form-label">Tên đăng nhập</label>
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                className="form-input"
                placeholder="Nhập tên đăng nhập"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="form-label">Mật khẩu</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
              }}
            >
              {loading && <span className="spinner" style={{ width: '16px', height: '16px' }}></span>}
              {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </button>
          </form>

          <SocialLoginButtons />

          <div
            style={{
              textAlign: 'center',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid #E8E0D0',
              fontSize: '0.9rem',
              color: '#7a5c3e',
            }}
          >
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              style={{ color: '#8B4513', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
              onMouseLeave={e => e.target.style.textDecoration = 'none'}
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: '#9e8562' }}>
          <Link to="/" style={{ color: '#9e8562', textDecoration: 'none' }}>← Quay lại trang chủ</Link>
        </div>
      </div>
    </div>
  )
}
