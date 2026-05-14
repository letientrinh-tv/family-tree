import React, { useState } from 'react'

const PAGE_URL = import.meta.env.VITE_FACEBOOK_PAGE_URL || 'https://m.me/61573215410018'

export default function FloatingChat() {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={PAGE_URL}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Chat với chúng tôi qua Facebook"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#1877F2',
        color: 'white',
        borderRadius: hovered ? 28 : '50%',
        width: hovered ? 'auto' : 52,
        height: 52,
        padding: hovered ? '0 18px 0 14px' : '0',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(24,119,242,0.5)',
        textDecoration: 'none',
        transition: 'border-radius 0.25s, width 0.25s, padding 0.25s, box-shadow 0.2s',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      <svg width="26" height="26" viewBox="0 0 36 36" fill="white" style={{ flexShrink: 0 }}>
        <path d="M18 2C9.163 2 2 8.73 2 17c0 4.708 2.184 8.93 5.633 11.812V34l5.117-2.813A16.86 16.86 0 0018 32c8.837 0 16-6.73 16-15S26.837 2 18 2zm1.77 20.17l-4.08-4.35-7.96 4.35L16.5 13.7l4.18 4.35 7.86-4.35-8.77 8.47z"/>
      </svg>
      {hovered && (
        <span style={{ fontFamily: 'Lora, Georgia, serif', fontWeight: 600, fontSize: '0.88rem' }}>
          Chat với chúng tôi
        </span>
      )}
    </a>
  )
}
