import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'

const BROWN = '#3C2415'
const SIENNA = '#8B4513'
const GOLD = '#C4A882'
const CREAM = '#FDFAF5'
const LIGHT = '#F5F0E8'
const MUTED = '#7a5c3e'

// ── Utilities ────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return ''
  const parts = d.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  if (parts.length === 2) return `${parts[1]}/${parts[0]}`
  return d
}

function genderLabel(g) {
  if (g === 'male') return 'Nam'
  if (g === 'female') return 'Nữ'
  return ''
}

// ── Print helpers ─────────────────────────────────────────────────────────────

function injectPrintStyle() {
  const existing = document.getElementById('book-print-style')
  if (existing) existing.remove()
  const s = document.createElement('style')
  s.id = 'book-print-style'
  s.textContent = `
    @media print {
      @page { size: A4 portrait; margin: 0; }
      body > * { display: none !important; }
      #book-print-root {
        display: block !important;
        position: fixed; inset: 0;
        background: white;
        z-index: 99999;
        overflow: visible;
      }
      .book-page {
        width: 210mm !important;
        min-height: 297mm !important;
        max-height: 297mm !important;
        padding: 14mm 16mm !important;
        box-sizing: border-box !important;
        page-break-after: always;
        break-after: page;
        overflow: hidden;
        background: white !important;
        box-shadow: none !important;
        margin: 0 !important;
      }
      .book-page:last-child { page-break-after: avoid; break-after: avoid; }
      .no-print { display: none !important; }
      .print-only { display: block !important; }
    }
  `
  document.head.appendChild(s)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Divider({ color = GOLD }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
      <div style={{ flex: 1, height: 1, background: color }} />
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      <div style={{ flex: 1, height: 1, background: color }} />
    </div>
  )
}

function PageHeader({ label, color = SIENNA }) {
  return (
    <div style={{ borderBottom: `2px solid ${color}`, paddingBottom: 6, marginBottom: 12 }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, color, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Lora,Georgia,serif' }}>
        {label}
      </span>
    </div>
  )
}

function RelativeChip({ name, sub }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 12,
      background: LIGHT, border: `1px solid ${GOLD}`, fontSize: '0.72rem',
      color: BROWN, fontFamily: 'Lora,Georgia,serif', marginRight: 4, marginBottom: 4,
    }}>
      {name}{sub ? <span style={{ color: MUTED, marginLeft: 4 }}>({sub})</span> : null}
    </span>
  )
}

// ── Pages ─────────────────────────────────────────────────────────────────────

function CoverPage({ treeName, treeDescription, year }) {
  return (
    <div className="book-page" style={{
      background: BROWN, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '40px 48px', minHeight: 842,
    }}>
      {/* Top ornament */}
      <div style={{ color: GOLD, fontSize: '1.4rem', letterSpacing: '0.3em', marginBottom: 24 }}>
        ✦ ✦ ✦
      </div>

      <div style={{ border: `1px solid ${GOLD}55`, padding: '32px 40px', width: '100%', maxWidth: 420 }}>
        <div style={{ color: GOLD, fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 20, fontFamily: 'Lora,Georgia,serif' }}>
          Gia Phả Dòng Họ
        </div>

        <Divider color={GOLD} />

        <h1 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: '2.2rem', color: '#F5F0E8', fontWeight: 700,
          margin: '20px 0', lineHeight: 1.3,
        }}>
          {treeName || 'Gia Phả'}
        </h1>

        <Divider color={GOLD} />

        {treeDescription && (
          <p style={{ color: GOLD + 'cc', fontSize: '0.82rem', margin: '16px 0 0', fontFamily: 'Lora,Georgia,serif', lineHeight: 1.7 }}>
            {treeDescription}
          </p>
        )}
      </div>

      <div style={{ color: GOLD + '99', fontSize: '0.7rem', letterSpacing: '0.15em', marginTop: 28, fontFamily: 'Lora,Georgia,serif' }}>
        {year}
      </div>

      <div style={{ color: GOLD, fontSize: '1rem', letterSpacing: '0.3em', marginTop: 20 }}>
        ✦ ✦ ✦
      </div>
    </div>
  )
}

function TocPage({ persons }) {
  return (
    <div className="book-page" style={{ background: CREAM, padding: '36px 48px', minHeight: 842 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Playfair Display,Georgia,serif', fontSize: '1.5rem', color: BROWN, margin: 0 }}>
          Danh Sách Thành Viên
        </h2>
        <Divider color={SIENNA} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
        {persons.map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'baseline', gap: 6,
            padding: '5px 0', borderBottom: `1px dotted ${GOLD}`,
          }}>
            <span style={{ color: MUTED, fontSize: '0.68rem', minWidth: 22, flexShrink: 0, fontFamily: 'Lora,Georgia,serif' }}>
              {i + 1}.
            </span>
            <span style={{ flex: 1, fontSize: '0.82rem', color: BROWN, fontFamily: 'Lora,Georgia,serif', fontWeight: 600 }}>
              {p.full_name}
            </span>
            {p.birth_date && (
              <span style={{ color: MUTED, fontSize: '0.68rem', fontFamily: 'Lora,Georgia,serif', flexShrink: 0 }}>
                {p.birth_date.split('-')[0]}
              </span>
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20, color: MUTED, fontSize: '0.7rem', fontFamily: 'Lora,Georgia,serif' }}>
        Tổng cộng: {persons.length} thành viên
      </div>
    </div>
  )
}

function DiagramPage({ imageUrl, treeName }) {
  return (
    <div className="book-page" style={{ background: CREAM, padding: '28px 32px', minHeight: 842, display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'Playfair Display,Georgia,serif', fontSize: '1.3rem', color: BROWN, margin: 0 }}>
          Sơ Đồ Gia Phả
        </h2>
        <Divider color={SIENNA} />
        {treeName && <div style={{ fontSize: '0.8rem', color: MUTED, fontFamily: 'Lora,Georgia,serif' }}>{treeName}</div>}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: LIGHT, borderRadius: 6, border: `1px solid ${GOLD}`, overflow: 'hidden' }}>
        {imageUrl
          ? <img src={imageUrl} alt="Sơ đồ gia phả" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          : <div style={{ color: MUTED, fontSize: '0.85rem', fontFamily: 'Lora,Georgia,serif' }}>Đang tải sơ đồ...</div>
        }
      </div>
    </div>
  )
}

function PersonPage({ person, index, parents, spouses, children }) {
  const lifespan = [
    person.birth_date ? `Sinh: ${formatDate(person.birth_date)}` : null,
    person.death_date ? `Mất: ${formatDate(person.death_date)}` : null,
  ].filter(Boolean).join('  ·  ')

  return (
    <div className="book-page" style={{ background: CREAM, padding: '28px 36px', minHeight: 842, display: 'flex', flexDirection: 'column' }}>
      {/* Page header */}
      <PageHeader label={`Thành viên thứ ${index + 1}`} />

      {/* Main content */}
      <div style={{ display: 'flex', gap: 20, flex: 1 }}>

        {/* Left: photo + basic info */}
        <div style={{ width: 150, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Photo */}
          <div style={{
            width: 150, height: 170, borderRadius: 6, overflow: 'hidden',
            border: `2px solid ${GOLD}`, background: LIGHT,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {person.photo_url
              ? <img src={person.photo_url} alt={person.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '3rem', color: GOLD }}>
                  {person.gender === 'male' ? '👨' : person.gender === 'female' ? '👩' : '👤'}
                </span>
            }
          </div>

          {/* Info badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {genderLabel(person.gender) && (
              <div style={{ fontSize: '0.72rem', color: MUTED, fontFamily: 'Lora,Georgia,serif' }}>
                <span style={{ color: SIENNA, fontWeight: 700 }}>Giới tính: </span>{genderLabel(person.gender)}
              </div>
            )}
            {person.birth_date && (
              <div style={{ fontSize: '0.72rem', color: MUTED, fontFamily: 'Lora,Georgia,serif' }}>
                <span style={{ color: SIENNA, fontWeight: 700 }}>Sinh: </span>{formatDate(person.birth_date)}
              </div>
            )}
            {person.death_date && (
              <div style={{ fontSize: '0.72rem', color: MUTED, fontFamily: 'Lora,Georgia,serif' }}>
                <span style={{ color: SIENNA, fontWeight: 700 }}>Mất: </span>{formatDate(person.death_date)}
              </div>
            )}
            {person.burial_place && (
              <div style={{ fontSize: '0.72rem', color: MUTED, fontFamily: 'Lora,Georgia,serif' }}>
                <span style={{ color: SIENNA, fontWeight: 700 }}>An táng: </span>{person.burial_place}
              </div>
            )}
          </div>
        </div>

        {/* Right: name, occupation, bio */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <h2 style={{
              fontFamily: 'Playfair Display,Georgia,serif',
              fontSize: '1.4rem', color: BROWN, margin: '0 0 2px',
            }}>
              {person.full_name}
            </h2>
            {person.nickname && (
              <div style={{ fontSize: '0.8rem', color: MUTED, fontFamily: 'Lora,Georgia,serif', fontStyle: 'italic' }}>
                "{person.nickname}"
              </div>
            )}
          </div>

          <Divider color={GOLD} />

          {person.occupation && (
            <div style={{ fontSize: '0.82rem', fontFamily: 'Lora,Georgia,serif', color: BROWN }}>
              <span style={{ color: SIENNA, fontWeight: 700 }}>Nghề nghiệp: </span>{person.occupation}
            </div>
          )}

          {person.biography && (
            <div style={{ flex: 1, fontSize: '0.8rem', fontFamily: 'Lora,Georgia,serif', color: BROWN, lineHeight: 1.8 }}>
              <div style={{ color: SIENNA, fontWeight: 700, fontSize: '0.78rem', marginBottom: 4 }}>Tiểu sử</div>
              <div style={{ background: LIGHT, borderLeft: `3px solid ${GOLD}`, padding: '8px 10px', borderRadius: '0 4px 4px 0' }}>
                {person.biography}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Family relationships */}
      {(parents.length > 0 || spouses.length > 0 || children.length > 0) && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${GOLD}` }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: SIENNA, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Lora,Georgia,serif', marginBottom: 8 }}>
            Quan hệ gia đình
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {parents.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.72rem', color: MUTED, fontFamily: 'Lora,Georgia,serif', minWidth: 60 }}>Cha/Mẹ:</span>
                {parents.map(p => <RelativeChip key={p.id} name={p.full_name} sub={genderLabel(p.gender)} />)}
              </div>
            )}
            {spouses.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.72rem', color: MUTED, fontFamily: 'Lora,Georgia,serif', minWidth: 60 }}>Vợ/Chồng:</span>
                {spouses.map(p => <RelativeChip key={p.id} name={p.full_name} />)}
              </div>
            )}
            {children.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.72rem', color: MUTED, fontFamily: 'Lora,Georgia,serif', minWidth: 60 }}>Con cái:</span>
                {children.map(p => <RelativeChip key={p.id} name={p.full_name} sub={genderLabel(p.gender)} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

const MemoPersonPage = React.memo(PersonPage)

export default function BookPreviewModal({ onClose, treeData, persons, relationships, getTreeImage }) {
  const [treeImageUrl, setTreeImageUrl] = useState(null)
  const [loadingImage, setLoadingImage] = useState(true)
  const [printing, setPrinting] = useState(false)
  const [printReady, setPrintReady] = useState(false)  // lazy: chỉ build print root khi cần
  const [currentPage, setCurrentPage] = useState(0)
  const year = new Date().getFullYear()
  const totalPages = persons.length + 3  // cover + toc + diagram + N persons

  useEffect(() => {
    if (!getTreeImage) { setLoadingImage(false); return }
    getTreeImage()
      .then(url => setTreeImageUrl(url))
      .catch(() => setTreeImageUrl(null))
      .finally(() => setLoadingImage(false))
  }, [])

  // Build relationship maps
  const getRelatives = useMemo(() => {
    const pm = {}
    persons.forEach(p => { pm[p.id] = p })

    const parentsOf = {}
    const childrenOf = {}
    const spousesOf = {}

    relationships.forEach(r => {
      if (r.relationship_type === 'spouse') {
        ;(spousesOf[r.person1_id] ||= []).push(r.person2_id)
        ;(spousesOf[r.person2_id] ||= []).push(r.person1_id)
      } else if (r.relationship_type === 'parent_child') {
        ;(childrenOf[r.person1_id] ||= []).push(r.person2_id)
        ;(parentsOf[r.person2_id]  ||= []).push(r.person1_id)
      }
    })

    return (id) => ({
      parents:  (parentsOf[id]  || []).map(i => pm[i]).filter(Boolean),
      spouses:  (spousesOf[id]  || []).map(i => pm[i]).filter(Boolean),
      children: (childrenOf[id] || []).map(i => pm[i]).filter(Boolean),
    })
  }, [persons, relationships])

  // Render một trang theo index (dùng cho cả preview và print)
  const renderPage = useCallback((idx) => {
    if (idx === 0) return <CoverPage key="cover" treeName={treeData?.name} treeDescription={treeData?.description} year={year} />
    if (idx === 1) return <TocPage key="toc" persons={persons} />
    if (idx === 2) return <DiagramPage key="diagram" imageUrl={treeImageUrl} treeName={treeData?.name} />
    const p = persons[idx - 3]
    if (!p) return null
    const { parents, spouses, children } = getRelatives(p.id)
    return <MemoPersonPage key={p.id} person={p} index={idx - 3} parents={parents} spouses={spouses} children={children} />
  }, [treeData, persons, treeImageUrl, getRelatives, year])

  const handlePrint = () => {
    setPrinting(true)
    setPrintReady(true)   // build print root lần đầu
    injectPrintStyle()
    // Chờ React render xong print root rồi mới gọi print
    setTimeout(() => {
      window.print()
      window.addEventListener('afterprint', () => {
        document.getElementById('book-print-style')?.remove()
        setPrinting(false)
      }, { once: true })
    }, 300)
  }

  const pageLabel = (idx) => {
    if (idx === 0) return 'Bìa'
    if (idx === 1) return 'Mục lục'
    if (idx === 2) return 'Sơ đồ'
    return persons[idx - 3]?.full_name || `Trang ${idx + 1}`
  }

  return (
    <>
      {/* ── Modal overlay ── */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,15,5,0.75)', display: 'flex', flexDirection: 'column', zIndex: 3000 }}>

        {/* Header */}
        <div className="no-print" style={{ background: BROWN, color: CREAM, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'Playfair Display,Georgia,serif', fontSize: '1.05rem' }}>📖 Xem trước sách gia phả</span>
            <span style={{ fontSize: '0.75rem', color: GOLD, fontFamily: 'Lora,Georgia,serif' }}>
              {loadingImage ? 'Đang tải sơ đồ...' : `${totalPages} trang · ${persons.length} thành viên`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handlePrint} disabled={loadingImage || printing}
              style={{ background: printing ? '#555' : SIENNA, color: CREAM, border: 'none', borderRadius: 6, padding: '7px 18px', cursor: 'pointer', fontFamily: 'Lora,Georgia,serif', fontWeight: 700, fontSize: '0.85rem', opacity: (loadingImage || printing) ? 0.7 : 1 }}>
              {printing ? 'Đang chuẩn bị...' : '🖨 In / Lưu PDF'}
            </button>
            <button onClick={onClose}
              style={{ background: 'none', border: `1px solid ${GOLD}55`, borderRadius: 6, padding: '7px 14px', color: GOLD, cursor: 'pointer', fontSize: '0.85rem' }}>
              ✕ Đóng
            </button>
          </div>
        </div>

        {/* Page navigation bar */}
        <div className="no-print" style={{ background: '#1e0f05', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, borderBottom: `1px solid ${BROWN}` }}>
          <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
            style={{ background: 'none', border: `1px solid ${GOLD}44`, borderRadius: 4, padding: '3px 10px', color: GOLD, cursor: currentPage === 0 ? 'not-allowed' : 'pointer', opacity: currentPage === 0 ? 0.4 : 1, fontSize: '0.85rem' }}>
            ‹
          </button>

          <span style={{ color: GOLD, fontFamily: 'Lora,Georgia,serif', fontSize: '0.8rem', minWidth: 180, textAlign: 'center' }}>
            Trang {currentPage + 1} / {totalPages} — {pageLabel(currentPage)}
          </span>

          <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1}
            style={{ background: 'none', border: `1px solid ${GOLD}44`, borderRadius: 4, padding: '3px 10px', color: GOLD, cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages - 1 ? 0.4 : 1, fontSize: '0.85rem' }}>
            ›
          </button>

          {/* Jump to person */}
          {persons.length > 0 && (
            <select
              value={currentPage}
              onChange={e => setCurrentPage(Number(e.target.value))}
              style={{ marginLeft: 'auto', background: '#2a1a0e', color: GOLD, border: `1px solid ${GOLD}44`, borderRadius: 4, padding: '3px 8px', fontFamily: 'Lora,Georgia,serif', fontSize: '0.78rem', cursor: 'pointer' }}
            >
              <option value={0}>Bìa</option>
              <option value={1}>Mục lục</option>
              <option value={2}>Sơ đồ gia phả</option>
              {persons.map((p, i) => (
                <option key={p.id} value={i + 3}>{p.full_name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Preview — chỉ render trang hiện tại */}
        <div className="no-print" style={{ flex: 1, overflowY: 'auto', background: '#2a1a0e', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 595, maxWidth: '100%' }}>
            {renderPage(currentPage)}
          </div>
        </div>
      </div>

      {/* ── Print root — chỉ render khi printReady để tránh chậm lúc mở ── */}
      <div id="book-print-root" style={{ display: 'none' }}>
        {printReady && Array.from({ length: totalPages }, (_, i) => renderPage(i))}
      </div>
    </>
  )
}
