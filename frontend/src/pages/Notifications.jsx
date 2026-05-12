import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'

const LABEL = {
  birthday: 'Sinh nhật',
  death_anniversary: 'Ngày giỗ',
  test: 'Kiểm tra',
  summary: 'Tổng hợp',
}

const CHANNEL_META = {
  email:    { label: 'Email',    icon: '📧', bg: '#EBF4FF', color: '#1d4ed8' },
  zalo:     { label: 'Zalo',     icon: '💬', bg: '#E8F5E9', color: '#006838' },
  facebook: { label: 'Facebook', icon: '📘', bg: '#E8EAF6', color: '#1877F2' },
  telegram: { label: 'Telegram', icon: '✈️', bg: '#E3F2FD', color: '#0088cc' },
  sms:      { label: 'SMS',      icon: '📱', bg: '#F0FDF4', color: '#15803d' },
}

const EVENT_COLOR = {
  birthday: { bg: '#EBF4FF', border: '#4A90D9', icon: '🎂' },
  death_anniversary: { bg: '#FEF3F2', border: '#b91c1c', icon: '🕯️' },
}

function Card({ children, style }) {
  return (
    <div style={{
      background: '#FDFAF5',
      border: '1px solid #C4A882',
      borderRadius: 10,
      padding: '24px',
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontFamily: 'Playfair Display, Georgia, serif',
      fontSize: '1.15rem',
      color: '#3C2415',
      margin: '0 0 16px 0',
      paddingBottom: 8,
      borderBottom: '1px solid #e8e0d0',
    }}>
      {children}
    </h2>
  )
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: 44, height: 24,
        borderRadius: 12,
        border: 'none',
        background: checked ? '#2D5016' : '#C4A882',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 2,
        left: checked ? 22 : 2,
        width: 20, height: 20,
        borderRadius: '50%',
        background: 'white',
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

export default function Notifications() {
  const { user } = useAuth()
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [logs, setLogs] = useState([])
  const [loadingUpcoming, setLoadingUpcoming] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [fbLinking, setFbLinking] = useState(false)
  const [fbLinkInfo, setFbLinkInfo] = useState(null)
  const [fbChecking, setFbChecking] = useState(false)
  const [tgLinking, setTgLinking] = useState(false)
  const [tgLinkUrl, setTgLinkUrl] = useState(null)
  const [tgChecking, setTgChecking] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [settingsRes, upcomingRes, logsRes] = await Promise.all([
        apiClient.get('/notifications/settings'),
        apiClient.get('/notifications/upcoming?days=60'),
        apiClient.get('/notifications/logs?limit=30'),
      ])
      setSettings(settingsRes.data)
      setForm(settingsRes.data)
      setUpcomingEvents(upcomingRes.data)
      setLogs(logsRes.data)
    } catch {
      toast.error('Không thể tải dữ liệu thông báo')
    } finally {
      setLoadingUpcoming(false)
      setLoadingLogs(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await apiClient.put('/notifications/settings', {
        notify_email: form.notify_email || null,
        notify_phone: form.notify_phone || null,
        email_enabled: form.email_enabled,
        zalo_enabled: form.zalo_enabled,
        facebook_enabled: form.facebook_enabled,
        telegram_enabled: form.telegram_enabled,
        telegram_chat_id: form.telegram_chat_id || null,
        days_before: form.days_before,
        active: form.active,
      })
      setSettings(res.data)
      setForm(res.data)
      toast.success('Đã lưu cài đặt thông báo')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleFacebookLink = async () => {
    setFbLinking(true)
    try {
      const res = await apiClient.post('/notifications/facebook/link-token')
      setFbLinkInfo(res.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Không thể tạo link kết nối')
    } finally {
      setFbLinking(false)
    }
  }

  const handleFacebookCheckLinked = async () => {
    setFbChecking(true)
    try {
      const res = await apiClient.get('/notifications/facebook/status')
      if (res.data.linked) {
        toast.success('Kết nối Facebook thành công!')
        setFbLinkInfo(null)
        fetchAll()
      } else {
        toast.error('Chưa nhận được tin nhắn. Hãy nhắn tin vào Page trước.')
      }
    } catch {
      toast.error('Không thể kiểm tra trạng thái')
    } finally {
      setFbChecking(false)
    }
  }

  const handleFacebookUnlink = async () => {
    try {
      await apiClient.delete('/notifications/facebook/unlink')
      toast.success('Đã huỷ kết nối Facebook')
      setFbLinkInfo(null)
      fetchAll()
    } catch {
      toast.error('Huỷ kết nối thất bại')
    }
  }

  const handleTelegramLink = async () => {
    setTgLinking(true)
    try {
      const res = await apiClient.post('/notifications/telegram/link-token')
      setTgLinkUrl(res.data.telegram_url)
    } catch {
      toast.error('Không thể tạo link kết nối')
    } finally {
      setTgLinking(false)
    }
  }

  const handleTelegramCheck = async () => {
    setTgChecking(true)
    try {
      // Poll Telegram trước để xử lý tin nhắn pending
      await apiClient.post('/telegram/poll').catch(() => {})
      const res = await apiClient.get('/notifications/telegram/status')
      if (res.data.linked) {
        toast.success('Kết nối Telegram thành công!')
        setTgLinkUrl(null)
        fetchAll()
      } else {
        toast.error('Chưa nhận được tin nhắn. Hãy mở link và nhắn START.')
      }
    } catch {
      toast.error('Không thể kiểm tra trạng thái')
    } finally {
      setTgChecking(false)
    }
  }

  const handleTelegramUnlink = async () => {
    try {
      await apiClient.delete('/notifications/telegram/unlink')
      toast.success('Đã huỷ kết nối Telegram')
      setTgLinkUrl(null)
      fetchAll()
    } catch {
      toast.error('Huỷ kết nối thất bại')
    }
  }

  const handleTest = async () => {
    if (!window.confirm('Gửi tin nhắn test đến tất cả kênh đang bật?')) return
    setTesting(true)
    try {
      const res = await apiClient.post('/notifications/test')
      const { results } = res.data
      Object.entries(results).forEach(([channel, r]) => {
        if (r.success) toast.success(`Gửi ${channel.toUpperCase()} thành công đến ${r.recipient}`)
        else toast.error(`Gửi ${channel.toUpperCase()} thất bại: ${r.error}`)
      })
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gửi test thất bại')
    } finally {
      setTesting(false)
    }
  }

  const isAdmin = user?.role === 'admin'
  const testAlreadySent = !isAdmin && logs.some(l => l.event_type === 'test')

  const isDirty = form && settings && (
    form.notify_email !== settings.notify_email ||
    form.notify_phone !== settings.notify_phone ||
    form.email_enabled !== settings.email_enabled ||
    form.zalo_enabled !== settings.zalo_enabled ||
    form.facebook_enabled !== settings.facebook_enabled ||
    form.telegram_enabled !== settings.telegram_enabled ||
    form.telegram_chat_id !== settings.telegram_chat_id ||
    form.days_before !== settings.days_before ||
    form.active !== settings.active
  )

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #C4A882',
    borderRadius: 6,
    background: '#FDFAF5',
    color: '#3C2415',
    fontFamily: 'Lora, Georgia, serif',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.82rem',
    color: '#7a5c3e',
    fontWeight: 600,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F0E8 0%, #EDE5D8 100%)',
      padding: '32px 16px',
      fontFamily: 'Lora, Georgia, serif',
    }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: '1.8rem',
            color: '#3C2415',
            margin: '0 0 6px 0',
          }}>
            🔔 Cài đặt thông báo
          </h1>
          <p style={{ color: '#7a5c3e', margin: 0, fontSize: '0.9rem' }}>
            Nhận nhắc nhở qua email hoặc SMS về sinh nhật và ngày giỗ trong gia phả
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>

          {/* Settings panel */}
          <div style={{ gridColumn: '1 / -1' }}>
            <Card>
              <SectionTitle>⚙️ Cài đặt thông báo</SectionTitle>

              {!form ? (
                <div style={{ color: '#7a5c3e', textAlign: 'center', padding: 20 }}>Đang tải...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Active toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: form.active ? '#F0F7EA' : '#F5F0E8',
                    borderRadius: 8, padding: '12px 16px', border: `1px solid ${form.active ? '#2D5016' : '#C4A882'}` }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#3C2415', fontSize: '0.95rem' }}>
                        Bật thông báo
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#7a5c3e' }}>
                        {form.active ? 'Hệ thống đang gửi thông báo' : 'Thông báo đang bị tắt'}
                      </div>
                    </div>
                    <Toggle
                      checked={form.active}
                      onChange={(v) => setForm(f => ({ ...f, active: v }))}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                    {/* Email */}
                    <div style={{ background: '#F8F4EF', borderRadius: 8, padding: 16, border: '1px solid #C4A882', opacity: form.active ? 1 : 0.6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontWeight: 700, color: '#3C2415', fontSize: '0.92rem' }}>📧 Email</span>
                        <Toggle checked={form.email_enabled} onChange={v => setForm(f => ({ ...f, email_enabled: v }))} disabled={!form.active} />
                      </div>
                      <label style={labelStyle}>Địa chỉ email</label>
                      <input type="email" value={form.notify_email || ''} onChange={e => setForm(f => ({ ...f, notify_email: e.target.value }))}
                        placeholder={user?.email} disabled={!form.active || !form.email_enabled}
                        style={{ ...inputStyle, opacity: (!form.active || !form.email_enabled) ? 0.5 : 1 }} />
                      <div style={{ fontSize: '0.72rem', color: '#9a7c60', marginTop: 4 }}>Để trống dùng email tài khoản</div>
                    </div>

                    {/* Telegram */}
                    <div style={{ background: '#E3F2FD', borderRadius: 8, padding: 16, border: '1px solid #90caf9', opacity: form.active ? 1 : 0.6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontWeight: 700, color: '#0088cc', fontSize: '0.92rem' }}>✈️ Telegram</span>
                        <Toggle
                          checked={form.telegram_enabled || false}
                          onChange={v => setForm(f => ({ ...f, telegram_enabled: v }))}
                          disabled={!form.active}
                        />
                      </div>

                      {settings?.telegram_chat_id ? (
                        <div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: '#dcfce7', border: '1px solid #86efac',
                            borderRadius: 6, padding: '8px 10px', marginBottom: 8,
                          }}>
                            <span>✅</span>
                            <span style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>Đã kết nối Telegram</span>
                          </div>
                          <button
                            onClick={handleTelegramUnlink}
                            disabled={!form.active}
                            style={{
                              width: '100%', padding: '7px 0',
                              background: 'white', border: '1px solid #fca5a5',
                              borderRadius: 6, color: '#b91c1c',
                              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                            }}
                          >Huỷ kết nối</button>
                        </div>
                      ) : tgLinkUrl ? (
                        <div>
                          <div style={{
                            background: '#fffbeb', border: '1px solid #fcd34d',
                            borderRadius: 6, padding: '10px 12px', marginBottom: 10,
                            fontSize: '0.82rem', color: '#92400e', lineHeight: 1.6,
                          }}>
                            <strong>Bước 1:</strong> Click nút bên dưới để mở bot<br />
                            <strong>Bước 2:</strong> Nhấn <strong>START</strong> trong Telegram<br />
                            <strong>Bước 3:</strong> Nhấn "Kiểm tra kết nối"
                          </div>
                          <a
                            href={tgLinkUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'block', textAlign: 'center',
                              padding: '9px 0', marginBottom: 8,
                              background: '#0088cc', color: 'white',
                              borderRadius: 6, fontSize: '0.88rem',
                              fontWeight: 700, textDecoration: 'none',
                            }}
                          >
                            ✈️ Mở @GiaPhaVietBot
                          </a>
                          <button
                            onClick={handleTelegramCheck}
                            disabled={tgChecking}
                            style={{
                              width: '100%', padding: '8px 0',
                              background: 'white', border: '1px solid #90caf9',
                              borderRadius: 6, color: '#0088cc',
                              fontSize: '0.82rem', fontWeight: 600,
                              cursor: tgChecking ? 'wait' : 'pointer',
                            }}
                          >
                            {tgChecking ? 'Đang kiểm tra...' : '🔄 Kiểm tra kết nối'}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '0.78rem', color: '#0066aa', marginBottom: 10, lineHeight: 1.5 }}>
                            Kết nối Telegram để nhận thông báo sinh nhật & ngày giỗ tức thì.
                          </div>
                          <button
                            onClick={handleTelegramLink}
                            disabled={!form.active || tgLinking}
                            style={{
                              width: '100%', padding: '9px 0',
                              background: form.active ? '#0088cc' : '#90caf9',
                              border: 'none', borderRadius: 6,
                              color: 'white', fontSize: '0.88rem',
                              fontWeight: 700, cursor: (!form.active || tgLinking) ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {tgLinking ? 'Đang tạo link...' : '🔗 Kết nối Telegram'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Days before */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16,
                    background: '#F8F4EF', borderRadius: 8, padding: 16, border: '1px solid #C4A882' }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Nhắc trước bao nhiêu ngày</label>
                      <div style={{ fontSize: '0.8rem', color: '#7a5c3e' }}>
                        Hệ thống sẽ gửi thông báo khi sự kiện còn trong vòng <strong>{form.days_before}</strong> ngày nữa
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => setForm(f => ({ ...f, days_before: Math.max(1, f.days_before - 1) }))}
                        style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #C4A882',
                          background: '#FDFAF5', cursor: 'pointer', fontSize: 18, color: '#3C2415',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >−</button>
                      <span style={{ minWidth: 36, textAlign: 'center', fontWeight: 700,
                        fontSize: '1.2rem', color: '#2D5016' }}>{form.days_before}</span>
                      <button
                        onClick={() => setForm(f => ({ ...f, days_before: Math.min(30, f.days_before + 1) }))}
                        style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #C4A882',
                          background: '#FDFAF5', cursor: 'pointer', fontSize: 18, color: '#3C2415',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >+</button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                    <div style={{ position: 'relative', display: 'inline-block' }} title={testAlreadySent ? 'Bạn đã gửi test rồi. Mỗi tài khoản chỉ được gửi 1 lần.' : ''}>
                      <button
                        onClick={handleTest}
                        disabled={testing || testAlreadySent || (!form.email_enabled && !form.telegram_enabled)}
                        style={{
                          padding: '9px 20px',
                          background: 'white',
                          border: '1px solid #C4A882',
                          borderRadius: 6,
                          color: testAlreadySent ? '#aaa' : '#8B4513',
                          fontFamily: 'Lora, Georgia, serif',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          cursor: (testing || testAlreadySent) ? 'not-allowed' : 'pointer',
                          opacity: (testAlreadySent || (!form.email_enabled && !form.telegram_enabled)) ? 0.5 : 1,
                        }}
                      >
                        {testing ? 'Đang gửi...' : testAlreadySent ? '📤 Đã gửi test' : '📤 Gửi test'}
                      </button>
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving || !isDirty}
                      style={{
                        padding: '9px 24px',
                        background: isDirty ? '#2D5016' : '#7a9c5c',
                        border: 'none',
                        borderRadius: 6,
                        color: 'white',
                        fontFamily: 'Lora, Georgia, serif',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        cursor: saving || !isDirty ? 'default' : 'pointer',
                        opacity: !isDirty ? 0.6 : 1,
                      }}
                    >
                      {saving ? 'Đang lưu...' : '💾 Lưu cài đặt'}
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Tabs: upcoming + history */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', gap: 0, marginBottom: -1 }}>
              {[
                { key: 'upcoming', label: '📅 Sự kiện sắp tới' },
                { key: 'logs', label: '📋 Lịch sử gửi' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '10px 20px',
                    background: activeTab === tab.key ? '#FDFAF5' : '#EDE5D8',
                    border: '1px solid #C4A882',
                    borderBottom: activeTab === tab.key ? '1px solid #FDFAF5' : '1px solid #C4A882',
                    borderRadius: activeTab === tab.key ? '8px 8px 0 0' : '8px 8px 0 0',
                    color: activeTab === tab.key ? '#2D5016' : '#7a5c3e',
                    fontFamily: 'Lora, Georgia, serif',
                    fontSize: '0.88rem',
                    fontWeight: activeTab === tab.key ? 700 : 500,
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: activeTab === tab.key ? 1 : 0,
                  }}
                >
                  {tab.label}
                  {tab.key === 'upcoming' && upcomingEvents.length > 0 && (
                    <span style={{
                      marginLeft: 6, background: '#b91c1c', color: 'white',
                      borderRadius: '50%', width: 18, height: 18,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 700,
                    }}>{upcomingEvents.length}</span>
                  )}
                </button>
              ))}
            </div>

            <Card style={{ borderRadius: '0 8px 8px 8px', borderTopLeftRadius: 0 }}>
              {activeTab === 'upcoming' && (
                <>
                  {loadingUpcoming ? (
                    <div style={{ color: '#7a5c3e', textAlign: 'center', padding: 32 }}>Đang tải...</div>
                  ) : upcomingEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎉</div>
                      <div style={{ color: '#7a5c3e', fontSize: '0.9rem' }}>
                        Không có sự kiện nào trong 60 ngày tới
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {upcomingEvents.map((e, i) => {
                        const colors = EVENT_COLOR[e.event_type] || { bg: '#F5F0E8', border: '#C4A882', icon: '📌' }
                        return (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 8, padding: '12px 14px',
                          }}>
                            <div style={{ fontSize: '1.6rem', flexShrink: 0 }}>{colors.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, color: '#3C2415', fontSize: '0.95rem' }}>
                                {e.person_name}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#7a5c3e', marginTop: 2 }}>
                                {LABEL[e.event_type]} • {e.event_date} • {e.tree_name}
                              </div>
                            </div>
                            <div style={{
                              flexShrink: 0,
                              background: e.days_until === 0 ? '#b91c1c' : e.days_until <= 3 ? '#d97706' : '#2D5016',
                              color: 'white',
                              borderRadius: 20,
                              padding: '4px 12px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                            }}>
                              {e.days_until === 0 ? 'Hôm nay' : `${e.days_until} ngày nữa`}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'logs' && (
                <>
                  {loadingLogs ? (
                    <div style={{ color: '#7a5c3e', textAlign: 'center', padding: 32 }}>Đang tải...</div>
                  ) : logs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📭</div>
                      <div style={{ color: '#7a5c3e', fontSize: '0.9rem' }}>
                        Chưa có lịch sử gửi thông báo
                      </div>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: '#F5F0E8' }}>
                            {['Thời gian', 'Kênh', 'Loại', 'Người nhận', 'Trạng thái'].map(h => (
                              <th key={h} style={{ padding: '8px 10px', textAlign: 'left',
                                color: '#3C2415', fontWeight: 700, borderBottom: '1px solid #C4A882' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map(log => (
                            <tr key={log.id} style={{ borderBottom: '1px solid #e8e0d0' }}>
                              <td style={{ padding: '8px 10px', color: '#7a5c3e' }}>
                                {new Date(log.sent_at).toLocaleString('vi-VN')}
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                {(() => {
                                  const ch = CHANNEL_META[log.channel] || { label: log.channel, icon: '📨', bg: '#F5F0E8', color: '#8B4513' }
                                  return (
                                    <span style={{ background: ch.bg, color: ch.color, padding: '2px 8px', borderRadius: 4, fontSize: '0.78rem', fontWeight: 600 }}>
                                      {ch.icon} {ch.label}
                                    </span>
                                  )
                                })()}
                              </td>
                              <td style={{ padding: '8px 10px', color: '#3C2415' }}>
                                {LABEL[log.event_type] || log.event_type}
                              </td>
                              <td style={{ padding: '8px 10px', color: '#7a5c3e', maxWidth: 180,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {log.recipient}
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                {log.success ? (
                                  <span style={{ color: '#2D5016', fontWeight: 600 }}>✓ Thành công</span>
                                ) : (
                                  <span title={log.error_message} style={{ color: '#b91c1c', fontWeight: 600, cursor: 'help' }}>
                                    ✗ Thất bại
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </div>

        {/* Info box */}
        <div style={{ marginTop: 20, background: '#FFF8E7', border: '1px solid #d97706', borderRadius: 8, padding: '14px 18px', fontSize: '0.82rem', color: '#7a5c3e', lineHeight: 1.7 }}>
          <strong style={{ color: '#92400e' }}>ℹ️ Hướng dẫn cài đặt:</strong><br />
          • <strong>Email:</strong> Nhập địa chỉ email để nhận thông báo. Để trống sẽ dùng email tài khoản.<br />
          • <strong>Telegram:</strong> Nhấn "Kết nối Telegram", mở bot và gửi START để liên kết tài khoản.<br />
          • Hệ thống tự động gửi nhắc nhở lúc <strong>8:00 SA</strong> mỗi ngày.
        </div>
      </div>
    </div>
  )
}
