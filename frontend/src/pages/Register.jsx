import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import SocialLoginButtons from '../components/SocialLoginButtons'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.username || !form.email || !form.password) {
      toast.error('Vui lòng nhập đầy đủ thông tin')
      return
    }
    if (form.username.length < 3) {
      toast.error('Tên đăng nhập phải có ít nhất 3 ký tự')
      return
    }
    if (form.password.length < 3) {
      toast.error('Mật khẩu phải có ít nhất 3 ký tự')
      return
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    setLoading(true)
    try {
      await apiClient.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
      })
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Đăng ký thất bại'
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
      <div style={{ width: '100%', maxWidth: '440px' }}>
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
            Đăng Ký
          </h1>
          <p style={{ color: '#7a5c3e', fontSize: '0.9rem' }}>
            Tạo tài khoản để bắt đầu lưu giữ gia phả
          </p>
        </div>

        {/* Card */}
        <div className="vintage-card" style={{ padding: '32px', background: '#FDFAF5' }}>
          <div
            style={{
              height: '4px',
              background: 'linear-gradient(to right, #C4A882, #2D5016, #C4A882)',
              borderRadius: '2px',
              marginBottom: '24px',
            }}
          />

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="form-label">Tên đăng nhập *</label>
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                className="form-input"
                placeholder="Ít nhất 3 ký tự"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="form-label">Email *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="form-input"
                placeholder="example@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="form-label">Mật khẩu *</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Ít nhất 3 ký tự"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="form-label">Xác nhận mật khẩu *</label>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
              />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p style={{ color: '#b91c1c', fontSize: '0.78rem', marginTop: '4px' }}>
                  Mật khẩu không khớp
                </p>
              )}
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
              {loading ? 'Đang đăng ký...' : 'Tạo Tài Khoản'}
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
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              style={{ color: '#8B4513', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
              onMouseLeave={e => e.target.style.textDecoration = 'none'}
            >
              Đăng nhập
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
