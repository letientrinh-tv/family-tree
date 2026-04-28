import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  const linkClass = (path) =>
    `px-3 py-1 rounded transition-colors font-medium text-sm ${
      isActive(path)
        ? 'bg-primary-700 text-secondary'
        : 'text-secondary hover:bg-primary-600 hover:text-white'
    }`

  return (
    <nav className="bg-primary-500 shadow-lg border-b-2 border-primary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🌳</span>
            <div>
              <span className="text-xl font-bold text-secondary font-serif tracking-wide group-hover:text-white transition-colors">
                Gia Phả Việt
              </span>
              <div className="text-xs text-primary-200 hidden sm:block leading-none">
                Lưu giữ ký ức dòng họ
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className={linkClass('/')}>Trang Chủ</Link>
            <Link to="/guide" className={linkClass('/guide')}>Hướng Dẫn</Link>

            {!isAuthenticated ? (
              <>
                <Link to="/register" className={linkClass('/register')}>Đăng Ký</Link>
                <Link
                  to="/login"
                  className="ml-2 px-4 py-1.5 bg-secondary text-primary-500 rounded font-semibold text-sm hover:bg-white transition-colors"
                >
                  Đăng Nhập
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className={linkClass('/dashboard')}>Dashboard</Link>
                <Link to="/notifications" className={linkClass('/notifications')}>
                  <span className="flex items-center gap-1">
                    <span>🔔</span> Thông báo
                  </span>
                </Link>
                {(!user?.plan || user.plan === 'free') ? (
                  <Link to="/upgrade" style={{
                    marginLeft: '4px', padding: '4px 12px',
                    background: 'linear-gradient(135deg, #d97706, #92400e)',
                    color: 'white', borderRadius: '6px', fontSize: '0.82rem',
                    fontWeight: 700, textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }}>⭐ Nâng cấp</Link>
                ) : (
                  <Link to="/upgrade" className={linkClass('/upgrade')}>
                    <span className="flex items-center gap-1"><span>💎</span> Gói dịch vụ</span>
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className={linkClass('/admin')}>
                    <span className="flex items-center gap-1">
                      <span>⚙</span> Quản Trị
                    </span>
                  </Link>
                )}
                <div className="ml-2 flex items-center gap-2 pl-2 border-l border-primary-400">
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-primary-600">
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-primary-500 font-bold text-sm">
                      {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-secondary text-sm font-medium">{user?.username}</span>
                    {isAdmin && (
                      <span className="text-xs bg-yellow-600 text-white px-1.5 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 text-secondary hover:text-white hover:bg-primary-600 rounded text-sm font-medium transition-colors"
                  >
                    Đăng Xuất
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-secondary hover:text-white p-2 rounded"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-3 pt-1 border-t border-primary-400 space-y-1">
            <Link to="/" className="block px-3 py-2 text-secondary hover:bg-primary-600 rounded text-sm" onClick={() => setMenuOpen(false)}>Trang Chủ</Link>
            <Link to="/guide" className="block px-3 py-2 text-secondary hover:bg-primary-600 rounded text-sm" onClick={() => setMenuOpen(false)}>Hướng Dẫn</Link>
            {!isAuthenticated ? (
              <>
                <Link to="/register" className="block px-3 py-2 text-secondary hover:bg-primary-600 rounded text-sm" onClick={() => setMenuOpen(false)}>Đăng Ký</Link>
                <Link to="/login" className="block px-3 py-2 text-secondary hover:bg-primary-600 rounded text-sm" onClick={() => setMenuOpen(false)}>Đăng Nhập</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="block px-3 py-2 text-secondary hover:bg-primary-600 rounded text-sm" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <Link to="/notifications" className="block px-3 py-2 text-secondary hover:bg-primary-600 rounded text-sm" onClick={() => setMenuOpen(false)}>🔔 Thông báo</Link>
                <Link to="/upgrade" className="block px-3 py-2 text-secondary hover:bg-primary-600 rounded text-sm" onClick={() => setMenuOpen(false)}>
                  {(!user?.plan || user.plan === 'free') ? '⭐ Nâng cấp gói' : '💎 Gói dịch vụ'}
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="block px-3 py-2 text-secondary hover:bg-primary-600 rounded text-sm" onClick={() => setMenuOpen(false)}>Quản Trị</Link>
                )}
                <div className="px-3 py-2 text-primary-200 text-sm">Đăng nhập: {user?.username}</div>
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false) }}
                  className="block w-full text-left px-3 py-2 text-secondary hover:bg-primary-600 rounded text-sm"
                >
                  Đăng Xuất
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
