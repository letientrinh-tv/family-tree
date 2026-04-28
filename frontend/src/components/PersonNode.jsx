import React, { useState, memo } from 'react'
import { Handle, Position } from 'reactflow'

const genderColors = {
  male: { bg: '#EBF4FF', border: '#4A90D9', avatar: '#4A90D9' },
  female: { bg: '#FEF0F6', border: '#D946A8', avatar: '#D946A8' },
  unknown: { bg: '#F5F0E8', border: '#C4A882', avatar: '#8B4513' },
}

function MaleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <circle cx="12" cy="8" r="4" />
      <path d="M12 14c-4.418 0-8 1.79-8 4v1h16v-1c0-2.21-3.582-4-8-4z" />
    </svg>
  )
}

function FemaleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <circle cx="12" cy="8" r="4" />
      <path d="M12 14c-4.418 0-8 1.79-8 4v1h16v-1c0-2.21-3.582-4-8-4z" />
      <path d="M8 7.5 Q12 4 16 7.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

const PersonNode = memo(({ data, selected }) => {
  const [hovered, setHovered] = useState(false)
  const colors = genderColors[data.gender] || genderColors.unknown

  const birthYear = data.birth_date ? data.birth_date.split('-')[0] || data.birth_date : null
  const deathYear = data.death_date ? data.death_date.split('-')[0] || data.death_date : null

  let lifespan = ''
  if (birthYear && deathYear) {
    lifespan = `${birthYear} – ${deathYear}`
  } else if (birthYear) {
    lifespan = `Sinh ${birthYear} – Còn sống`
  } else if (deathYear) {
    lifespan = `Mất ${deathYear}`
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: colors.bg,
        border: `2px solid ${selected ? '#2D5016' : colors.border}`,
        borderRadius: '10px',
        padding: '10px 12px',
        minWidth: '160px',
        maxWidth: '200px',
        boxShadow: selected
          ? '0 0 0 3px rgba(45,80,22,0.3), 2px 4px 12px rgba(0,0,0,0.15)'
          : '2px 4px 10px rgba(60,36,21,0.15)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        fontFamily: 'Lora, Georgia, serif',
      }}
    >
      <Handle type="source" id="top" position={Position.Top}
        style={{ background: colors.border, width: 8, height: 8 }} />
      <Handle type="source" id="bottom" position={Position.Bottom}
        style={{ background: colors.border, width: 8, height: 8 }} />
      <Handle type="source" id="left" position={Position.Left}
        style={{ background: colors.border, width: 8, height: 8 }} />
      <Handle type="source" id="right" position={Position.Right}
        style={{ background: colors.border, width: 8, height: 8 }} />

      {/*
        Nút hover: top: -20px thay vì -28px
        → đáy nút nằm tại y = -20 + 24 = +4 (overlap 4px vào card)
        → không có gap → mouseleave không bị kích hoạt sớm
      */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 5,
          zIndex: 10,
          opacity: hovered ? 1 : 0,
          pointerEvents: hovered ? 'auto' : 'none',
          transition: 'opacity 0.15s',
        }}
      >
        {[
          { mode: 'parent', label: '↑', title: 'Thêm cha / mẹ', bg: '#8B4513' },
          { mode: 'spouse', label: '♥', title: 'Thêm vợ / chồng', bg: '#D946A8' },
          { mode: 'child',  label: '↓', title: 'Thêm con',        bg: '#2D5016' },
        ].map(({ mode, label, title, bg }) => (
          <button
            key={mode}
            onClick={(e) => { e.stopPropagation(); data.onAddRelative?.(mode, data.id) }}
            title={title}
            style={{
              background: bg, color: 'white', border: 'none',
              borderRadius: '50%', width: 24, height: 24,
              cursor: 'pointer', fontSize: 14, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-2">
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          overflow: 'hidden', border: `2px solid ${colors.border}`,
          flexShrink: 0, background: colors.bg,
        }}>
          {data.photo_url ? (
            <img src={data.photo_url} alt={data.full_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: colors.avatar, padding: '8px',
            }}>
              {data.gender === 'female' ? <FemaleIcon /> : <MaleIcon />}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#3C2415', lineHeight: 1.3, wordBreak: 'break-word' }}>
            {data.full_name}
          </div>
          {lifespan && (
            <div style={{ fontSize: '0.7rem', color: '#7a5c3e', marginTop: 2 }}>{lifespan}</div>
          )}
          {data.occupation && (
            <div style={{
              fontSize: '0.68rem', color: '#8a6c50', marginTop: 2,
              fontStyle: 'italic', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {data.occupation}
            </div>
          )}
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 5, right: 6,
        width: 8, height: 8, borderRadius: '50%',
        background: colors.border, opacity: 0.7,
      }} />
    </div>
  )
})

PersonNode.displayName = 'PersonNode'

export default PersonNode
