import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('React Error Boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#F5F0E8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Lora, Georgia, serif',
        }}>
          <div style={{
            maxWidth: 520,
            background: '#FDFAF5',
            border: '1px solid #C4A882',
            borderRadius: 12,
            padding: '32px',
            boxShadow: '2px 4px 16px rgba(60,36,21,0.2)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
            <h2 style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '1.4rem',
              color: '#3C2415',
              marginBottom: 8,
            }}>
              Đã xảy ra lỗi
            </h2>
            <p style={{ color: '#7a5c3e', fontSize: '0.9rem', marginBottom: 20 }}>
              Ứng dụng gặp sự cố. Vui lòng tải lại trang hoặc liên hệ quản trị viên.
            </p>
            {this.state.error && (
              <pre style={{
                background: '#FEF2F2',
                border: '1px solid #fca5a5',
                borderRadius: 6,
                padding: '10px 14px',
                fontSize: '0.75rem',
                color: '#991b1b',
                textAlign: 'left',
                overflow: 'auto',
                marginBottom: 20,
                maxHeight: 160,
              }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#8B4513',
                color: '#F5F0E8',
                border: 'none',
                borderRadius: 6,
                padding: '10px 24px',
                fontSize: '0.9rem',
                fontFamily: 'Lora, Georgia, serif',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔄 Tải lại trang
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
