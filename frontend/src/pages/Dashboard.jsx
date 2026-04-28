import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    })
  } catch {
    return dateStr
  }
}

function CreateTreeModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên gia phả')
      return
    }
    setLoading(true)
    try {
      const res = await apiClient.post('/trees', form)
      toast.success('Tạo cây gia phả thành công!')
      onCreate(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Tạo thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(60, 36, 21, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="vintage-card fade-in"
        style={{ width: '100%', maxWidth: '480px', padding: '28px', background: '#FDFAF5' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.4rem', color: '#3C2415', margin: 0 }}>
            Tạo Cây Gia Phả Mới
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#8B4513', cursor: 'pointer', fontSize: '1.3rem' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="form-label">Tên gia phả *</label>
            <input
              value={form.name}
              onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              className="form-input"
              placeholder="VD: Gia Phả Họ Nguyễn, Gia Phả Dòng Họ Trần..."
              autoFocus
            />
          </div>
          <div>
            <label className="form-label">Mô tả (tùy chọn)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
              className="form-input"
              rows={3}
              placeholder="Mô tả ngắn về gia phả này..."
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {loading && <span className="spinner" style={{ width: '14px', height: '14px' }}></span>}
              {loading ? 'Đang tạo...' : 'Tạo Gia Phả'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TreeCard({ tree, onOpen, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    setDeleting(true)
    try {
      await apiClient.delete(`/trees/${tree.id}`)
      toast.success('Đã xóa gia phả')
      onDelete(tree.id)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Xóa thất bại')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="vintage-card"
      style={{
        padding: '20px',
        background: '#FDFAF5',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative',
      }}
      onClick={() => onOpen(tree.id)}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '4px 4px 16px rgba(60,36,21,0.2)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '2px 2px 8px rgba(60,36,21,0.15)'
      }}
    >
      {/* Tree icon + name */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #2D5016, #4a7a22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            flexShrink: 0,
          }}
        >
          🌳
        </div>
        <div>
          <h3
            style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#3C2415',
              margin: '0 0 4px',
              wordBreak: 'break-word',
            }}
          >
            {tree.name}
          </h3>
          {tree.description && (
            <p style={{ fontSize: '0.82rem', color: '#7a5c3e', margin: 0, lineHeight: 1.5 }}>
              {tree.description.length > 80 ? tree.description.slice(0, 80) + '...' : tree.description}
            </p>
          )}
        </div>
      </div>

      {/* Meta info */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#7a5c3e' }}>
          <span>👥</span>
          <span>{tree.person_count || 0} thành viên</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#7a5c3e' }}>
          <span>📅</span>
          <span>{formatDate(tree.updated_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #E8E0D0', paddingTop: '10px' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(tree.id) }}
          className="btn-accent"
          style={{ flex: 1, padding: '6px', fontSize: '0.82rem' }}
        >
          Mở Gia Phả
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            padding: '6px 12px',
            background: confirmDelete ? '#b91c1c' : 'transparent',
            color: confirmDelete ? '#fff' : '#b91c1c',
            border: `1px solid ${confirmDelete ? '#991b1b' : '#b91c1c'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontFamily: 'Lora, Georgia, serif',
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          {deleting ? '...' : confirmDelete ? 'Xác nhận?' : 'Xóa'}
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trees, setTrees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  useEffect(() => {
    apiClient.get('/trees')
      .then(res => setTrees(res.data))
      .catch(err => toast.error('Lỗi tải danh sách: ' + (err.response?.data?.detail || err.message)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: '#F5F0E8' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3C2415 0%, #8B4513 100%)',
          padding: isMobile ? '20px 16px' : '32px 24px',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1
                style={{
                  fontFamily: 'Playfair Display, Georgia, serif',
                  fontSize: '1.8rem',
                  color: '#F5F0E8',
                  margin: '0 0 4px',
                }}
              >
                Cây Gia Phả Của Tôi
              </h1>
              <p style={{ color: '#d4c5a9', fontSize: '0.9rem', margin: 0 }}>
                Xin chào, {user?.username} · {trees.length} gia phả
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
              style={{
                padding: '10px 20px',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#F5F0E8',
                color: '#8B4513',
                border: '1px solid #C4A882',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>+</span> Tạo Cây Mới
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div className="spinner mx-auto" style={{ width: '2rem', height: '2rem' }}></div>
            <p style={{ color: '#8B4513', marginTop: '12px', fontFamily: 'Lora, Georgia, serif' }}>Đang tải...</p>
          </div>
        ) : trees.length === 0 ? (
          <div
            className="vintage-card"
            style={{
              padding: isMobile ? '32px 20px' : '60px',
              textAlign: 'center',
              background: '#FDFAF5',
              maxWidth: '500px',
              margin: '0 auto',
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🌱</div>
            <h3
              style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: '1.4rem',
                color: '#3C2415',
                marginBottom: '8px',
              }}
            >
              Chưa có gia phả nào
            </h3>
            <p style={{ color: '#7a5c3e', marginBottom: '24px', fontSize: '0.9rem' }}>
              Bắt đầu tạo gia phả đầu tiên của bạn để lưu giữ ký ức dòng họ
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
              style={{ padding: '10px 24px' }}
            >
              Tạo Gia Phả Đầu Tiên
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
            }}
          >
            {trees.map(tree => (
              <TreeCard
                key={tree.id}
                tree={tree}
                onOpen={(id) => navigate(`/tree/${id}`)}
                onDelete={(id) => setTrees(prev => prev.filter(t => t.id !== id))}
              />
            ))}

            {/* Add new card */}
            <div
              className="vintage-card"
              style={{
                padding: '20px',
                background: '#FDFAF5',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '160px',
                border: '2px dashed #C4A882',
                boxShadow: 'none',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onClick={() => setShowModal(true)}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#F5EFE4'
                e.currentTarget.style.borderColor = '#8B4513'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#FDFAF5'
                e.currentTarget.style.borderColor = '#C4A882'
              }}
            >
              <div style={{ textAlign: 'center', color: '#C4A882' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>+</div>
                <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: '0.9rem', color: '#8B4513' }}>
                  Tạo Gia Phả Mới
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <CreateTreeModal
          onClose={() => setShowModal(false)}
          onCreate={(newTree) => setTrees(prev => [newTree, ...prev])}
        />
      )}
    </div>
  )
}
