import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import { STATUS_MAP, TEMPLATES } from '../components/PrintOrderModal'

// ── Plan config (mirror backend plans.py) ────────────────────
const PLANS = {
  free:     { label: 'Miễn phí',   trees: 1, members: 30,   price: 0,         color: '#6b7280', bg: '#f3f4f6' },
  basic:    { label: 'Cơ bản',     trees: 1, members: 200,  price: 300000,    color: '#2D5016', bg: '#f0fdf4' },
  standard: { label: 'Tiêu chuẩn', trees: 1, members: 1000, price: 500000,    color: '#1d4ed8', bg: '#eff6ff' },
  premium:  { label: 'Cao cấp',    trees: 3, members: 2000, price: 1000000,   color: '#92400e', bg: '#fffbeb' },
}
const PLAN_KEYS = Object.keys(PLANS)

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtMoney(n) {
  return n === 0 ? 'Miễn phí' : n.toLocaleString('vi-VN') + ' ₫/năm'
}

function PlanBadge({ plan }) {
  const p = PLANS[plan] || PLANS.free
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
      background: p.bg, color: p.color, border: `1px solid ${p.color}40`,
    }}>{p.label}</span>
  )
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="vintage-card" style={{ padding: '18px 20px', background: '#FDFAF5', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 52, height: 52, borderRadius: 12, background: color + '18', border: `2px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontFamily: 'Playfair Display,Georgia,serif', fontSize: '1.7rem', fontWeight: 700, color, lineHeight: 1 }}>{typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}</div>
        <div style={{ fontSize: '0.82rem', color: '#7a5c3e', marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: '#9a7c60', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── User Edit Modal ───────────────────────────────────────────
function UserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    role: user.role,
    is_active: user.is_active,
    plan: user.plan || 'free',
    plan_expires_at: user.plan_expires_at ? user.plan_expires_at.split('T')[0] : '',
  })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form }
      if (payload.plan_expires_at) payload.plan_expires_at = new Date(payload.plan_expires_at).toISOString()
      else delete payload.plan_expires_at
      const res = await apiClient.put(`/admin/users/${user.id}`, payload)
      toast.success('Đã cập nhật người dùng')
      onSaved(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await apiClient.delete(`/admin/users/${user.id}`)
      toast.success(`Đã xóa người dùng ${user.username}`)
      onSaved(null)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Xóa thất bại')
    } finally {
      setDeleting(false)
    }
  }

  const planInfo = PLANS[form.plan] || PLANS.free
  const labelS = { display: 'block', fontSize: '0.78rem', color: '#7a5c3e', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }
  const inputS = { width: '100%', padding: '8px 10px', border: '1px solid #C4A882', borderRadius: 6, background: '#FDFAF5', color: '#3C2415', fontFamily: 'Lora,Georgia,serif', fontSize: '0.88rem', boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(60,36,21,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 480, background: '#FDFAF5', borderRadius: 12, border: '1px solid #C4A882', padding: 28, fontFamily: 'Lora,Georgia,serif' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display,Georgia,serif', fontSize: '1.25rem', color: '#3C2415', margin: 0 }}>Quản lý người dùng</h2>
            <p style={{ color: '#7a5c3e', fontSize: '0.82rem', margin: '4px 0 0' }}>@{user.username} · {user.email}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#8B4513', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            ['🌳 Cây gia phả', user.tree_count],
            ['👥 Tổng thành viên', user.total_members],
          ].map(([l, v]) => (
            <div key={l} style={{ background: '#F5F0E8', borderRadius: 8, padding: '10px 14px', border: '1px solid #C4A882' }}>
              <div style={{ fontSize: '0.78rem', color: '#7a5c3e' }}>{l}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#3C2415' }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Plan */}
          <div>
            <label style={labelS}>Gói dịch vụ</label>
            <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} style={inputS}>
              {PLAN_KEYS.map(k => (
                <option key={k} value={k}>{PLANS[k].label} — {fmtMoney(PLANS[k].price)} ({PLANS[k].trees} cây, {PLANS[k].members} thành viên/cây)</option>
              ))}
            </select>
          </div>

          {/* Plan expiry */}
          {form.plan !== 'free' && (
            <div>
              <label style={labelS}>Hạn sử dụng gói</label>
              <input type="date" value={form.plan_expires_at} onChange={e => setForm(f => ({ ...f, plan_expires_at: e.target.value }))} style={inputS} />
            </div>
          )}

          {/* Role */}
          <div>
            <label style={labelS}>Vai trò</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={inputS}>
              <option value="user">User – Người dùng thường</option>
              <option value="admin">Admin – Quản trị viên</option>
            </select>
          </div>

          {/* Active */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F5F0E8', borderRadius: 8, padding: '12px 14px', border: '1px solid #C4A882' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#3C2415', fontSize: '0.9rem' }}>Trạng thái tài khoản</div>
              <div style={{ fontSize: '0.78rem', color: '#7a5c3e' }}>{form.is_active ? 'Đang hoạt động' : 'Đã bị khóa'}</div>
            </div>
            <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: form.is_active ? '#2D5016' : '#C4A882', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', top: 2, left: form.is_active ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 22, justifyContent: 'space-between' }}>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{ padding: '8px 16px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Lora,Georgia,serif', fontWeight: 600 }}>
              🗑 Xóa tài khoản
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 600 }}>Xác nhận xóa?</span>
              <button onClick={handleDelete} disabled={deleting} style={{ padding: '6px 12px', background: '#b91c1c', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'Lora,Georgia,serif' }}>{deleting ? '...' : 'Xóa'}</button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '6px 12px', background: '#F5F0E8', color: '#3C2415', border: '1px solid #C4A882', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'Lora,Georgia,serif' }}>Hủy</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '8px 16px', background: '#F5F0E8', color: '#3C2415', border: '1px solid #C4A882', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Lora,Georgia,serif' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', background: '#2D5016', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Lora,Georgia,serif', fontWeight: 700 }}>{saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main AdminPanel ───────────────────────────────────────────
export default function AdminPanel() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [trees, setTrees] = useState([])
  const [printOrders, setPrintOrders] = useState([])
  const [tab, setTab] = useState('users')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  const loadData = useCallback(async () => {
    try {
      const [sRes, uRes, tRes, pRes] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/admin/users'),
        apiClient.get('/admin/trees'),
        apiClient.get('/admin/print-orders'),
      ])
      setStats(sRes.data)
      setUsers(uRes.data)
      setTrees(tRes.data)
      setPrintOrders(pRes.data)
    } catch (err) {
      toast.error('Lỗi tải dữ liệu: ' + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleUserSaved = (updated) => {
    if (updated === null) {
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id))
    } else {
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
    }
    loadData()
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchPlan = planFilter === 'all' || u.plan === planFilter
    return matchSearch && matchPlan
  })

  const thS = { padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#5a3820', fontSize: '0.78rem', background: '#F5EFE4', borderBottom: '2px solid #C4A882', fontFamily: 'Lora,Georgia,serif', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }
  const tdS = { padding: '10px 12px', borderBottom: '1px solid #E8E0D0', fontSize: '0.84rem', color: '#3C2415', verticalAlign: 'middle' }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', background: '#F5F0E8' }}>
      <div className="text-center">
        <div className="spinner mx-auto" style={{ width: '2rem', height: '2rem' }}></div>
        <p style={{ color: '#8B4513', marginTop: 12, fontFamily: 'Lora,Georgia,serif' }}>Đang tải...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: '#F5F0E8', fontFamily: 'Lora,Georgia,serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #3C2415 0%, #8B4513 100%)', padding: '28px 24px' }}>
        <div className="max-w-7xl mx-auto">
          <h1 style={{ fontFamily: 'Playfair Display,Georgia,serif', fontSize: '1.8rem', color: '#F5F0E8', margin: '0 0 4px' }}>⚙ Bảng Quản Trị</h1>
          <p style={{ color: '#d4c5a9', fontSize: '0.9rem', margin: 0 }}>Quản lý người dùng, phân quyền và gói dịch vụ</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard icon="👥" label="Tổng người dùng" value={stats?.total_users} color="#8B4513" />
          <StatCard icon="🌳" label="Tổng cây gia phả" value={stats?.total_trees} color="#2D5016" />
          <StatCard icon="👨" label="Tổng thành viên" value={stats?.total_persons} color="#4a3000" />
          {stats?.users_by_plan && Object.entries(stats.users_by_plan).map(([plan, count]) => (
            <StatCard key={plan} icon={plan === 'free' ? '🆓' : plan === 'basic' ? '⭐' : plan === 'standard' ? '🌟' : '👑'}
              label={`Gói ${PLANS[plan]?.label}`} value={count} color={PLANS[plan]?.color || '#6b7280'} />
          ))}
        </div>

        {/* Plan pricing reference */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 24 }}>
          {PLAN_KEYS.map(k => {
            const p = PLANS[k]
            return (
              <div key={k} style={{ background: p.bg, border: `1px solid ${p.color}40`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, color: p.color, fontSize: '0.92rem', marginBottom: 4 }}>
                  {k === 'free' ? '🆓' : k === 'basic' ? '⭐' : k === 'standard' ? '🌟' : '👑'} {p.label}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#3C2415', lineHeight: 1.6 }}>
                  🌳 {p.trees} cây · 👥 {p.members.toLocaleString()} TV/cây<br />
                  💰 {fmtMoney(p.price)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Tabs */}
        <div className="admin-tabs" style={{ display: 'flex', gap: 0, borderBottom: '2px solid #C4A882', marginBottom: 0 }}>
          {[
            { id: 'users', label: isMobile ? `👤 Users (${users.length})` : `👤 Người Dùng (${users.length})` },
            { id: 'trees', label: isMobile ? `🌳 Cây (${trees.length})` : `🌳 Gia Phả (${trees.length})` },
            { id: 'print', label: isMobile ? `🖨 In (${printOrders.length})` : `🖨 Đơn In (${printOrders.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: isMobile ? '8px 10px' : '10px 20px', background: tab === t.id ? '#8B4513' : 'transparent', color: tab === t.id ? '#F5F0E8' : '#7a5c3e', border: 'none', borderRadius: '6px 6px 0 0', cursor: 'pointer', fontFamily: 'Lora,Georgia,serif', fontWeight: 600, fontSize: isMobile ? '0.78rem' : '0.9rem', transition: 'all 0.2s', flex: isMobile ? 1 : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {tab === 'users' && (
          <div className="vintage-card" style={{ borderRadius: '0 8px 8px 8px' }}>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, padding: '14px 16px', borderBottom: '1px solid #E8E0D0', flexWrap: 'wrap' }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Tìm tên / email..."
                style={{ flex: 1, minWidth: 180, padding: '7px 12px', border: '1px solid #C4A882', borderRadius: 6, background: '#FDFAF5', color: '#3C2415', fontFamily: 'Lora,Georgia,serif', fontSize: '0.85rem' }}
              />
              <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
                style={{ padding: '7px 12px', border: '1px solid #C4A882', borderRadius: 6, background: '#FDFAF5', color: '#3C2415', fontFamily: 'Lora,Georgia,serif', fontSize: '0.85rem' }}>
                <option value="all">Tất cả gói</option>
                {PLAN_KEYS.map(k => <option key={k} value={k}>{PLANS[k].label}</option>)}
              </select>
              <span style={{ alignSelf: 'center', fontSize: '0.82rem', color: '#7a5c3e' }}>{filteredUsers.length} kết quả</span>
            </div>

            <div className="table-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <thead>
                  <tr>
                    {['#', 'Người dùng', 'Email', 'Gói', 'Hạn gói', 'Vai trò', 'TK/TV', 'Trạng thái', 'Tham gia', 'Thao tác'].map(h => (
                      <th key={h} style={thS}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => {
                    const plan = PLANS[user.plan] || PLANS.free
                    const expired = user.plan_expires_at && new Date(user.plan_expires_at) < new Date()
                    return (
                      <tr key={user.id} style={{ background: user.is_active ? '#FDFAF5' : '#FEF2F2' }}>
                        <td style={tdS}><span style={{ color: '#9a7c60', fontSize: '0.78rem' }}>#{user.id}</span></td>
                        <td style={tdS}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: user.role === 'admin' ? '#8B4513' : '#C4A882', color: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>
                              {user.username[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700 }}>{user.username}</div>
                              {user.social_provider && <div style={{ fontSize: '0.7rem', color: '#9a7c60' }}>via {user.social_provider}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ ...tdS, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</td>
                        <td style={tdS}><PlanBadge plan={user.plan} /></td>
                        <td style={tdS}>
                          {user.plan === 'free' ? <span style={{ color: '#9a7c60', fontSize: '0.78rem' }}>—</span> : (
                            <span style={{ fontSize: '0.78rem', color: expired ? '#b91c1c' : '#2D5016', fontWeight: expired ? 700 : 400 }}>
                              {expired ? '⚠ ' : ''}{fmtDate(user.plan_expires_at)}
                            </span>
                          )}
                        </td>
                        <td style={tdS}>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: user.role === 'admin' ? '#8B451320' : '#2D501620', color: user.role === 'admin' ? '#8B4513' : '#2D5016', border: `1px solid ${user.role === 'admin' ? '#8B451340' : '#2D501640'}` }}>
                            {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                          </span>
                        </td>
                        <td style={tdS}>
                          <span style={{ fontSize: '0.82rem' }}>{user.tree_count}🌳 / {user.total_members}👥</span>
                        </td>
                        <td style={tdS}>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: user.is_active ? '#dcfce7' : '#fee2e2', color: user.is_active ? '#166534' : '#991b1b' }}>
                            {user.is_active ? '✓ Hoạt động' : '✗ Đã khóa'}
                          </span>
                        </td>
                        <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{fmtDate(user.created_at)}</td>
                        <td style={tdS}>
                          <button onClick={() => setSelectedUser(user)} style={{ padding: '5px 12px', background: '#F5EFE4', color: '#3C2415', border: '1px solid #C4A882', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'Lora,Georgia,serif', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            ✏ Quản lý
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#7a5c3e' }}>Không tìm thấy người dùng</div>
              )}
            </div>
          </div>
        )}

        {/* Trees tab */}
        {tab === 'trees' && (
          <div className="vintage-card table-scroll" style={{ borderRadius: '0 8px 8px 8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>{['#', 'Tên gia phả', 'Chủ sở hữu', 'Thành viên', 'Ngày tạo', 'Cập nhật'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {trees.map(tree => {
                  const owner = users.find(u => u.username === tree.owner_username)
                  return (
                    <tr key={tree.id} style={{ background: '#FDFAF5' }}>
                      <td style={tdS}><span style={{ color: '#9a7c60', fontSize: '0.78rem' }}>#{tree.id}</span></td>
                      <td style={tdS}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '1.1rem' }}>🌳</span>
                          <div>
                            <div style={{ fontWeight: 600 }}>{tree.name}</div>
                            {tree.description && <div style={{ fontSize: '0.73rem', color: '#7a5c3e' }}>{tree.description.slice(0, 50)}{tree.description.length > 50 ? '…' : ''}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={tdS}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: '#8B4513' }}>{tree.owner_username || '—'}</span>
                          {owner && <PlanBadge plan={owner.plan || 'free'} />}
                        </div>
                      </td>
                      <td style={tdS}>
                        <span style={{ padding: '2px 10px', borderRadius: 20, background: '#F5EFE4', border: '1px solid #C4A882', fontSize: '0.82rem', fontWeight: 700, color: '#8B4513' }}>
                          {tree.person_count || 0} người
                        </span>
                      </td>
                      <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{fmtDate(tree.created_at)}</td>
                      <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{fmtDate(tree.updated_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {trees.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#7a5c3e' }}>Chưa có gia phả nào</div>}
          </div>
        )}

        {/* Print orders tab */}
        {tab === 'print' && (
          <div className="vintage-card" style={{ borderRadius: '0 8px 8px 8px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Người dùng', 'Gia phả', 'Khung / Kích cỡ', 'Trạng thái', 'Người nhận', 'Điện thoại', 'Địa chỉ', 'Ngày đặt', 'Thao tác'].map(h => (
                    <th key={h} style={thS}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {printOrders.map(order => {
                  const st = STATUS_MAP[order.status] || STATUS_MAP.pending
                  const tpl = TEMPLATES.find(t => t.id === order.template)
                  return (
                    <tr key={order.id} style={{ background: '#FDFAF5' }}>
                      <td style={tdS}><span style={{ color: '#9a7c60', fontSize: '0.78rem' }}>#{order.id}</span></td>
                      <td style={tdS}>
                        <div style={{ fontWeight: 700, color: '#3C2415' }}>{order.username || '—'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#9a7c60' }}>{order.user_email}</div>
                      </td>
                      <td style={{ ...tdS, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.tree_name || '—'}
                      </td>
                      <td style={tdS}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{tpl?.name || order.template}</div>
                        <div style={{ fontSize: '0.72rem', color: '#9a7c60' }}>{order.size}</div>
                      </td>
                      <td style={tdS}>
                        <select
                          value={order.status}
                          onChange={async e => {
                            const newStatus = e.target.value
                            try {
                              const res = await apiClient.put(`/admin/print-orders/${order.id}`, { status: newStatus })
                              setPrintOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: res.data.status } : o))
                              toast.success('Đã cập nhật trạng thái')
                            } catch {
                              toast.error('Cập nhật thất bại')
                            }
                          }}
                          style={{ padding: '3px 6px', borderRadius: 12, border: `1px solid ${st.color}60`, background: st.bg, color: st.color, fontFamily: 'Lora,Georgia,serif', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          {Object.entries(STATUS_MAP).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ ...tdS, fontWeight: 600 }}>{order.recipient_name}</td>
                      <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{order.phone}</td>
                      <td style={{ ...tdS, maxWidth: 200, fontSize: '0.8rem' }}>
                        {order.address}, {order.city}
                        {order.notes && <div style={{ fontSize: '0.72rem', color: '#9a7c60', fontStyle: 'italic', marginTop: 2 }}>{order.notes}</div>}
                      </td>
                      <td style={{ ...tdS, whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{fmtDate(order.created_at)}</td>
                      <td style={tdS}>
                        <a href={`tel:${order.phone}`} style={{ padding: '4px 10px', background: '#2D5016', color: '#F5F0E8', borderRadius: 6, fontSize: '0.75rem', fontFamily: 'Lora,Georgia,serif', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
                          📞 Gọi
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {printOrders.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#7a5c3e' }}>Chưa có đơn in nào</div>}
          </div>
        )}
      </div>

      {selectedUser && (
        <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} onSaved={handleUserSaved} />
      )}
    </div>
  )
}
