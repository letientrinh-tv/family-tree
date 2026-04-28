import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || ''

function loadScript(src, id) {
  return new Promise((resolve) => {
    if (document.getElementById(id)) { resolve(); return }
    const s = document.createElement('script')
    s.id = id
    s.src = src
    s.async = true
    s.onload = resolve
    document.body.appendChild(s)
  })
}

export default function SocialLoginButtons() {
  const { loginWithSocial } = useAuth()
  const navigate = useNavigate()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [fbLoading, setFbLoading] = useState(false)
  const tokenClientRef = useRef(null)

  // Load Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    loadScript('https://accounts.google.com/gsi/client', 'google-gsi').then(() => {
      if (!window.google) return
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: () => {},
      })
    })
  }, [])

  // Load Facebook SDK
  useEffect(() => {
    if (!FACEBOOK_APP_ID) return
    // Define fbAsyncInit before loading the script so SDK calls it on load
    if (!window.fbAsyncInit) {
      window.fbAsyncInit = () => {
        window.FB.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: false, version: 'v19.0' })
      }
    }
    // Defer script injection outside React's render cycle
    const t = setTimeout(() => {
      loadScript('https://connect.facebook.net/en_US/sdk.js', 'facebook-jssdk')
    }, 0)
    return () => clearTimeout(t)
  }, [])

  const handleSuccess = async (provider, token) => {
    try {
      await loginWithSocial(provider, token)
      toast.success('Đăng nhập thành công!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || `Đăng nhập ${provider} thất bại`)
    } finally {
      setGoogleLoading(false)
      setFbLoading(false)
    }
  }

  const handleGoogle = () => {
    if (!GOOGLE_CLIENT_ID) { toast.error('Google OAuth chưa được cấu hình'); return }
    if (!tokenClientRef.current) { toast.error('Google SDK đang tải, thử lại'); return }
    setGoogleLoading(true)
    tokenClientRef.current.callback = (resp) => {
      if (resp.error) {
        toast.error('Đăng nhập Google thất bại')
        setGoogleLoading(false)
        return
      }
      handleSuccess('google', resp.access_token)
    }
    tokenClientRef.current.requestAccessToken({ prompt: 'select_account' })
  }

  const handleFacebook = () => {
    if (!FACEBOOK_APP_ID) { toast.error('Facebook OAuth chưa được cấu hình'); return }
    if (!window.FB) { toast.error('Facebook SDK đang tải, thử lại'); return }
    setFbLoading(true)
    window.FB.login(
      (resp) => {
        if (resp.authResponse) {
          handleSuccess('facebook', resp.authResponse.accessToken)
        } else {
          toast.error('Đăng nhập Facebook bị hủy')
          setFbLoading(false)
        }
      },
      { scope: 'public_profile' },
    )
  }

  const base = {
    width: '100%', padding: '10px 16px', borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    fontSize: '0.92rem', fontWeight: 600, cursor: 'pointer',
    fontFamily: 'Lora, Georgia, serif', transition: 'opacity 0.15s, box-shadow 0.15s',
  }

  const Spinner = () => (
    <span style={{
      width: 18, height: 18, borderRadius: '50%', display: 'inline-block',
      border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white',
      animation: 'gspin 0.7s linear infinite',
    }} />
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#E8E0D0' }} />
        <span style={{ color: '#9a7c60', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
          hoặc đăng nhập bằng
        </span>
        <div style={{ flex: 1, height: 1, background: '#E8E0D0' }} />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        style={{ ...base, background: 'white', color: '#3c4043', border: '1px solid #dadce0' }}
        onMouseEnter={e => !googleLoading && (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)')}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
      >
        {googleLoading ? <Spinner /> : (
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
        )}
        {googleLoading ? 'Đang xử lý...' : 'Tiếp tục với Google'}
      </button>

      {/* Facebook */}
      <button
        type="button"
        onClick={handleFacebook}
        disabled={fbLoading}
        style={{ ...base, background: '#1877F2', color: 'white', border: '1px solid #1877F2' }}
        onMouseEnter={e => !fbLoading && (e.currentTarget.style.background = '#166FE5')}
        onMouseLeave={e => e.currentTarget.style.background = '#1877F2'}
      >
        {fbLoading ? <Spinner /> : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )}
        {fbLoading ? 'Đang xử lý...' : 'Tiếp tục với Facebook'}
      </button>
    </div>
  )
}
