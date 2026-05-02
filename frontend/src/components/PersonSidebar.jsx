import React, { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import DatePicker from './DatePicker'

export default function PersonSidebar({ person, relationships, persons, onClose, onSave, onDelete, onAddRelative }) {
  const [formData, setFormData] = useState({
    full_name: '',
    nickname: '',
    gender: 'unknown',
    birth_date: '',
    death_date: '',
    occupation: '',
    burial_place: '',
    biography: '',
    notify_events: true,
  })
  const [isAlive, setIsAlive] = useState(true)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileInputRef = useRef()

  useEffect(() => {
    if (person) {
      const alive = !person.death_date
      setIsAlive(alive)
      setFormData({
        full_name: person.full_name || '',
        nickname: person.nickname || '',
        gender: person.gender || 'unknown',
        birth_date: person.birth_date || '',
        death_date: person.death_date || '',
        occupation: person.occupation || '',
        burial_place: person.burial_place || '',
        biography: person.biography || '',
        notify_events: person.notify_events !== false,
      })
      setPhotoPreview(person.photo_url || null)
      setConfirmDelete(false)
    }
  }, [person?.id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiClient.post(`/persons/${person.id}/photo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPhotoPreview(res.data.photo_url)
      toast.success('Tải ảnh lên thành công')
      onSave(res.data)
    } catch (err) {
      toast.error('Lỗi tải ảnh: ' + (err.response?.data?.detail || err.message))
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      toast.error('Vui lòng nhập họ tên')
      return
    }
    setSaving(true)
    try {
      const res = await apiClient.put(`/persons/${person.id}`, formData)
      toast.success('Đã lưu thông tin')
      onSave(res.data)
    } catch (err) {
      toast.error('Lỗi lưu: ' + (err.response?.data?.detail || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    onDelete(person.id)
  }

  // Build relationship summary
  const personMap = {}
  if (persons) persons.forEach(p => { personMap[p.id] = p })

  const parents = []
  const children = []
  const spouses = []

  if (relationships) {
    relationships.forEach(rel => {
      if (rel.relationship_type === 'parent_child') {
        if (rel.person2_id === person.id) {
          // person is child -> person1 is parent
          if (personMap[rel.person1_id]) parents.push(personMap[rel.person1_id])
        } else if (rel.person1_id === person.id) {
          // person is parent -> person2 is child
          if (personMap[rel.person2_id]) children.push(personMap[rel.person2_id])
        }
      } else if (rel.relationship_type === 'spouse') {
        if (rel.person1_id === person.id && personMap[rel.person2_id]) {
          spouses.push(personMap[rel.person2_id])
        } else if (rel.person2_id === person.id && personMap[rel.person1_id]) {
          spouses.push(personMap[rel.person1_id])
        }
      }
    })
  }

  const inputClass = "form-input mt-0.5"
  const labelClass = "form-label"

  return (
    <div
      style={{
        width: '360px',
        minWidth: '360px',
        height: '100%',
        background: '#FDFAF5',
        borderLeft: '2px solid #C4A882',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'Lora, Georgia, serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#8B4513',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <h3 style={{ color: '#F5F0E8', fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, fontSize: '1rem', margin: 0 }}>
          Thông Tin Thành Viên
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#F5F0E8',
            cursor: 'pointer',
            fontSize: '1.2rem',
            lineHeight: 1,
            padding: '2px 6px',
            borderRadius: '4px',
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.target.style.background = 'transparent'}
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* Photo section */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              border: '3px solid #C4A882',
              overflow: 'hidden',
              margin: '0 auto 8px',
              background: '#F5F0E8',
              cursor: 'pointer',
            }}
            onClick={() => fileInputRef.current?.click()}
            title="Nhấn để đổi ảnh"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: '#C4A882' }}>
                {formData.gender === 'female' ? '👩' : '👨'}
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" style={{ display: 'none' }} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              background: 'transparent',
              border: '1px solid #C4A882',
              borderRadius: '4px',
              padding: '3px 10px',
              fontSize: '0.75rem',
              color: '#8B4513',
              cursor: 'pointer',
            }}
          >
            {uploading ? 'Đang tải...' : 'Đổi ảnh'}
          </button>
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label className={labelClass}>Họ và tên *</label>
            <input
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className={inputClass}
              placeholder="Nhập họ và tên"
            />
          </div>

          <div>
            <label className={labelClass}>Giới tính</label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              {[{ value: 'male', label: 'Nam' }, { value: 'female', label: 'Nữ' }, { value: 'unknown', label: 'Chưa rõ' }].map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="radio"
                    name="gender"
                    value={opt.value}
                    checked={formData.gender === opt.value}
                    onChange={handleChange}
                    style={{ accentColor: '#8B4513' }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Bí danh */}
          <div>
            <label className={labelClass}>Bí danh</label>
            <input
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              className={inputClass}
              placeholder="Tên thường gọi, hiệu..."
            />
          </div>

          {/* Còn sống / Đã mất */}
          <div>
            <label className={labelClass}>Tình trạng</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              {[{ v: true, l: '✔ Còn sống', c: '#2D5016' }, { v: false, l: '✝ Đã mất', c: '#8B4513' }].map(o => (
                <label key={String(o.v)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', color: isAlive === o.v ? o.c : '#9a7c60', fontWeight: isAlive === o.v ? 700 : 400 }}>
                  <input
                    type="radio"
                    checked={isAlive === o.v}
                    onChange={() => {
                      setIsAlive(o.v)
                      if (o.v) setFormData(p => ({ ...p, death_date: '' }))
                    }}
                    style={{ accentColor: o.c }}
                  />
                  {o.l}
                </label>
              ))}
            </div>
          </div>

          {/* Ngày sinh */}
          <div>
            <label className={labelClass}>Ngày sinh</label>
            <DatePicker
              value={formData.birth_date}
              onChange={(val) => setFormData(p => ({ ...p, birth_date: val }))}
              placeholder="Năm sinh"
            />
          </div>

          {/* Ngày mất — chỉ hiện khi Đã mất */}
          {!isAlive && (
            <div>
              <label className={labelClass}>Ngày mất</label>
              <DatePicker
                value={formData.death_date}
                onChange={(val) => setFormData(p => ({ ...p, death_date: val }))}
                placeholder="Năm mất"
              />
            </div>
          )}

          <div>
            <label className={labelClass}>Nghề nghiệp</label>
            <input
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              className={inputClass}
              placeholder="VD: Nông dân, Giáo viên..."
            />
          </div>

          {!isAlive && (
            <div>
              <label className={labelClass}>Nơi an táng</label>
              <input
                name="burial_place"
                value={formData.burial_place}
                onChange={handleChange}
                className={inputClass}
                placeholder="Địa điểm an táng (nếu có)"
              />
            </div>
          )}

          <div>
            <label className={labelClass}>Tiểu sử / Ghi chú</label>
            <textarea
              name="biography"
              value={formData.biography}
              onChange={handleChange}
              rows={4}
              className={inputClass}
              placeholder="Ghi chú về cuộc đời, sự nghiệp..."
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Notification settings */}
        <div style={{ marginTop: '12px', padding: '10px 12px', background: '#F0F5EC', borderRadius: '8px', border: '1px solid #C4D9B0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.notify_events}
              onChange={e => setFormData(p => ({ ...p, notify_events: e.target.checked }))}
              style={{ accentColor: '#2D5016', width: 15, height: 15 }}
            />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2D5016' }}>Nhận thông báo sự kiện</span>
          </label>
          {formData.notify_events && (
            <div style={{ marginTop: '6px', paddingLeft: '23px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {(() => {
                const parseDM = (d) => {
                  if (!d) return null
                  if (d.includes('/')) { const p = d.split('/'); if (p.length === 3) return { day: p[0], month: p[1] } }
                  if (d.includes('-')) { const p = d.split('-'); if (p.length === 3) return { day: parseInt(p[2]), month: parseInt(p[1]) } }
                  return null
                }
                const items = []
                const bd = parseDM(formData.birth_date)
                const dd = parseDM(formData.death_date)
                if (isAlive && bd) items.push({ icon: '🎂', text: `Sinh nhật: ngày ${bd.day} tháng ${bd.month} hàng năm` })
                if (!isAlive && dd) items.push({ icon: '🕯️', text: `Ngày giỗ: ngày ${dd.day} tháng ${dd.month} hàng năm` })
                if (items.length === 0)
                  return <p style={{ fontSize: '0.75rem', color: '#7a9c60', margin: 0 }}>Chọn ngày đầy đủ để nhận nhắc nhở.</p>
                return items.map((it, i) => (
                  <div key={i} style={{ fontSize: '0.75rem', color: '#3C6020' }}>{it.icon} {it.text}</div>
                ))
              })()}
            </div>
          )}
        </div>

        {/* Relationship summary */}
        {(parents.length > 0 || spouses.length > 0 || children.length > 0) && (
          <div style={{ marginTop: '16px', padding: '10px', background: '#F5F0E8', borderRadius: '6px', border: '1px solid #C4A882' }}>
            <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '0.85rem', fontWeight: 700, color: '#8B4513', marginBottom: '6px', margin: '0 0 6px' }}>
              Quan Hệ Gia Đình
            </h4>
            {parents.length > 0 && (
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#7a5c3e', fontWeight: 600 }}>Cha/Mẹ: </span>
                <span style={{ fontSize: '0.75rem', color: '#3C2415' }}>{parents.map(p => p.full_name).join(', ')}</span>
              </div>
            )}
            {spouses.length > 0 && (
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#7a5c3e', fontWeight: 600 }}>Vợ/Chồng: </span>
                <span style={{ fontSize: '0.75rem', color: '#3C2415' }}>{spouses.map(p => p.full_name).join(', ')}</span>
              </div>
            )}
            {children.length > 0 && (
              <div>
                <span style={{ fontSize: '0.75rem', color: '#7a5c3e', fontWeight: 600 }}>Con cái: </span>
                <span style={{ fontSize: '0.75rem', color: '#3C2415' }}>{children.map(p => p.full_name).join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add relative buttons */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #E8E0D0', flexShrink: 0 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8B4513', marginBottom: '8px', fontFamily: 'Playfair Display, Georgia, serif' }}>
          Thêm thành viên liên quan
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => onAddRelative?.('parent')}
            style={{
              flex: 1, padding: '6px 4px', fontSize: '0.72rem', cursor: 'pointer',
              background: '#F5F0E8', border: '1px solid #8B4513', borderRadius: '6px',
              color: '#8B4513', fontWeight: 600, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '2px', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#E8D5B0'}
            onMouseLeave={e => e.currentTarget.style.background = '#F5F0E8'}
          >
            <span style={{ fontSize: '1rem' }}>↑</span>
            Cha / Mẹ
          </button>
          <button
            onClick={() => onAddRelative?.('spouse')}
            style={{
              flex: 1, padding: '6px 4px', fontSize: '0.72rem', cursor: 'pointer',
              background: '#FEF0F6', border: '1px solid #D946A8', borderRadius: '6px',
              color: '#D946A8', fontWeight: 600, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '2px', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FBDAEF'}
            onMouseLeave={e => e.currentTarget.style.background = '#FEF0F6'}
          >
            <span style={{ fontSize: '1rem' }}>♥</span>
            Vợ / Chồng
          </button>
          <button
            onClick={() => onAddRelative?.('child')}
            style={{
              flex: 1, padding: '6px 4px', fontSize: '0.72rem', cursor: 'pointer',
              background: '#F0F5EC', border: '1px solid #2D5016', borderRadius: '6px',
              color: '#2D5016', fontWeight: 600, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '2px', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#D6E8C8'}
            onMouseLeave={e => e.currentTarget.style.background = '#F0F5EC'}
          >
            <span style={{ fontSize: '1rem' }}>↓</span>
            Con
          </button>
        </div>
      </div>

      {/* Footer buttons */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #C4A882', display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          {saving ? <span className="spinner" style={{ width: '14px', height: '14px' }}></span> : null}
          {saving ? 'Đang lưu...' : 'Lưu Thông Tin'}
        </button>
        <button
          onClick={handleDelete}
          className={confirmDelete ? 'btn-danger' : 'btn-secondary'}
          style={{ minWidth: '80px' }}
        >
          {confirmDelete ? 'Xác nhận xóa' : 'Xóa'}
        </button>
      </div>
    </div>
  )
}
