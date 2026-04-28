import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
  addEdge,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import toast from 'react-hot-toast'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'

import apiClient from '../api/client'
import PersonNode from '../components/PersonNode'
import PersonSidebar from '../components/PersonSidebar'
import PrintOrderModal from '../components/PrintOrderModal'

const nodeTypes = { person: PersonNode }

const edgeStyle = {
  parent_child: {
    stroke: '#8B4513',
    strokeWidth: 2,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#8B4513' },
  },
  spouse: {
    stroke: '#D946A8',
    strokeWidth: 2,
    strokeDasharray: '6,4',
  },
}

function AddPersonModal({ mode, relativeOf, onClose, onAdd }) {
  const [form, setForm] = useState({
    full_name: '',
    gender: 'unknown',
    birth_date: '',
    death_date: '',
    occupation: '',
  })
  const [loading, setLoading] = useState(false)

  const modeLabel = {
    first: 'Thêm Thành Viên Đầu Tiên',
    standalone: 'Thêm Thành Viên Mới',
    parent: `Thêm Cha/Mẹ của "${relativeOf?.full_name || ''}"`,
    spouse: `Thêm Vợ/Chồng của "${relativeOf?.full_name || ''}"`,
    child: `Thêm Con của "${relativeOf?.full_name || ''}"`,
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim()) {
      toast.error('Vui lòng nhập họ tên')
      return
    }
    setLoading(true)
    try {
      await onAdd(form, mode, relativeOf)
      onClose()
    } catch {
      // error handled in caller
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(60,36,21,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="vintage-card fade-in"
        style={{ width: '100%', maxWidth: '440px', padding: '24px', background: '#FDFAF5' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.1rem', color: '#3C2415', margin: 0 }}>
            {modeLabel[mode] || 'Thêm Thành Viên'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B4513', fontSize: '1.2rem' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label className="form-label">Họ và tên *</label>
            <input
              value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              className="form-input"
              placeholder="Nhập họ và tên đầy đủ"
              autoFocus
            />
          </div>
          <div>
            <label className="form-label">Giới tính</label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              {[{ v: 'male', l: 'Nam' }, { v: 'female', l: 'Nữ' }, { v: 'unknown', l: 'Chưa rõ' }].map(o => (
                <label key={o.v} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="radio"
                    value={o.v}
                    checked={form.gender === o.v}
                    onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                    style={{ accentColor: '#8B4513' }}
                  />
                  {o.l}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label className="form-label">Năm sinh</label>
              <input
                value={form.birth_date}
                onChange={e => setForm(p => ({ ...p, birth_date: e.target.value }))}
                className="form-input"
                placeholder="VD: 1950"
              />
            </div>
            <div>
              <label className="form-label">Năm mất</label>
              <input
                value={form.death_date}
                onChange={e => setForm(p => ({ ...p, death_date: e.target.value }))}
                className="form-input"
                placeholder="Bỏ trống nếu còn sống"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Nghề nghiệp</label>
            <input
              value={form.occupation}
              onChange={e => setForm(p => ({ ...p, occupation: e.target.value }))}
              className="form-input"
              placeholder="Tùy chọn"
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Hủy</button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {loading && <span className="spinner" style={{ width: '14px', height: '14px' }}></span>}
              Thêm
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConnectModal({ connection, persons, onClose, onConfirm }) {
  const src = persons.find(p => p.id === parseInt(connection.source))
  const tgt = persons.find(p => p.id === parseInt(connection.target))
  if (!src || !tgt) return null

  const row = (label, color, border, onClick) => (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '9px 10px', marginBottom: '6px',
        background: color, border: `1px solid ${border}`, borderRadius: '6px',
        color: border, fontWeight: 600, fontSize: '0.8rem',
        cursor: 'pointer', textAlign: 'left',
        fontFamily: 'Lora, Georgia, serif',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
    >
      {label}
    </button>
  )

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(60,36,21,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="vintage-card fade-in" style={{ padding: '22px', maxWidth: '400px', width: '90%', background: '#FDFAF5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1rem', color: '#3C2415', margin: 0 }}>
            Chọn kiểu quan hệ
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B4513', fontSize: '1.1rem' }}>✕</button>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#7a5c3e', marginBottom: '14px' }}>
          <strong style={{ color: '#3C2415' }}>{src.full_name}</strong> — <strong style={{ color: '#3C2415' }}>{tgt.full_name}</strong>
        </p>
        {row(`↑  ${src.full_name} là cha/mẹ của ${tgt.full_name}`, '#F5F0E8', '#8B4513', () => onConfirm('parent_child', src.id, tgt.id))}
        {row(`↑  ${tgt.full_name} là cha/mẹ của ${src.full_name}`, '#F5F0E8', '#8B4513', () => onConfirm('parent_child', tgt.id, src.id))}
        {row(`♥  ${src.full_name} và ${tgt.full_name} là vợ/chồng`, '#FEF0F6', '#D946A8', () => onConfirm('spouse', src.id, tgt.id))}
        <button onClick={onClose} className="btn-secondary" style={{ width: '100%', marginTop: '4px' }}>Hủy</button>
      </div>
    </div>
  )
}

const genderMeta = {
  male:    { label: 'Nam',     color: '#4A90D9', icon: '♂' },
  female:  { label: 'Nữ',     color: '#D946A8', icon: '♀' },
  unknown: { label: '?',      color: '#8B4513', icon: '?' },
}

function MemberListModal({ persons, onClose, onEdit, onDelete, onAdd }) {
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return persons
    return persons.filter(p =>
      p.full_name.toLowerCase().includes(q) ||
      (p.occupation && p.occupation.toLowerCase().includes(q)) ||
      (p.birth_date && String(p.birth_date).includes(q))
    )
  }, [persons, search])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(60,36,21,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '700px', maxWidth: '100%', maxHeight: '88vh',
        background: '#FDFAF5', borderRadius: '12px',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(60,36,21,0.3)',
        border: '1px solid #C4A882',
        fontFamily: 'Lora, Georgia, serif',
      }}>
        {/* Header */}
        <div style={{ background: '#8B4513', padding: '13px 18px', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h3 style={{ color: '#F5F0E8', fontFamily: 'Playfair Display, Georgia, serif', margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
            Danh Sách Thành Viên
          </h3>
          <button onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#F5F0E8', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: '2px 6px', borderRadius: '4px' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >✕</button>
        </div>

        {/* Search + Add */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #E8E0D0', display: 'flex', gap: '8px', flexShrink: 0 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#C4A882', pointerEvents: 'none' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên, nghề nghiệp..."
              className="form-input"
              style={{ paddingLeft: '28px', margin: 0 }}
              autoFocus
            />
          </div>
          <button onClick={onAdd} className="btn-primary" style={{ whiteSpace: 'nowrap', padding: '6px 14px' }}>
            + Thêm mới
          </button>
        </div>

        {/* Summary bar */}
        <div style={{ padding: '5px 14px', background: '#F5F0E8', borderBottom: '1px solid #E8E0D0', fontSize: '0.7rem', color: '#7a5c3e', flexShrink: 0 }}>
          {filtered.length === persons.length ? `${persons.length} thành viên` : `${filtered.length} / ${persons.length} kết quả`}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#7a5c3e', padding: '48px 24px', fontSize: '0.85rem' }}>
              Không tìm thấy thành viên nào
            </div>
          ) : filtered.map((person, idx) => {
            const meta = genderMeta[person.gender] || genderMeta.unknown
            const birthY = person.birth_date ? (person.birth_date.split('-')[0] || person.birth_date) : null
            const deathY = person.death_date ? (person.death_date.split('-')[0] || person.death_date) : null
            const lifeInfo = [birthY && `Sinh ${birthY}`, deathY && `Mất ${deathY}`, person.occupation].filter(Boolean).join(' · ')
            const isDeleting = deletingId === person.id

            return (
              <div key={person.id}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 14px', background: idx % 2 === 0 ? '#FDFAF5' : '#F9F5EE', borderBottom: '1px solid #F0E8D8' }}
              >
                {/* Avatar */}
                <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${meta.color}`, background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {person.photo_url
                    ? <img src={person.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: meta.color, fontSize: '1.1rem' }}>{meta.icon}</span>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#3C2415' }}>{person.full_name}</span>
                    <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '10px', background: meta.color, color: '#fff', fontWeight: 700 }}>{meta.label}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#7a5c3e', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lifeInfo || 'Chưa có thông tin'}
                  </div>
                </div>

                {/* Actions */}
                {isDeleting ? (
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button onClick={() => { onDelete(person.id); setDeletingId(null) }}
                      style={{ padding: '4px 9px', fontSize: '0.72rem', background: '#C0392B', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}>
                      Xác nhận xóa
                    </button>
                    <button onClick={() => setDeletingId(null)}
                      style={{ padding: '4px 9px', fontSize: '0.72rem', background: '#E8E0D0', color: '#5C4033', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button onClick={() => onEdit(person)}
                      style={{ padding: '4px 10px', fontSize: '0.72rem', background: '#F5F0E8', border: '1px solid #8B4513', borderRadius: '4px', color: '#8B4513', cursor: 'pointer', fontWeight: 600 }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#E8D5B0' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#F5F0E8' }}>
                      ✏️ Sửa
                    </button>
                    <button onClick={() => setDeletingId(person.id)}
                      style={{ padding: '4px 10px', fontSize: '0.72rem', background: '#FEF0F0', border: '1px solid #C0392B', borderRadius: '4px', color: '#C0392B', cursor: 'pointer', fontWeight: 600 }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FADBD8' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#FEF0F0' }}>
                      🗑 Xóa
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TreeEditorInner() {
  const { treeId } = useParams()
  const navigate = useNavigate()
  const { getNodes, fitView } = useReactFlow()
  const [treeData, setTreeData] = useState(null)
  const [persons, setPersons] = useState([])
  const [relationships, setRelationships] = useState([])
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedPersonId, setSelectedPersonId] = useState(null)
  const selectedPerson = useMemo(
    () => selectedPersonId != null ? (persons.find(p => p.id === selectedPersonId) ?? null) : null,
    [persons, selectedPersonId]
  )
  const [undoStack, setUndoStack] = useState([]) // [{person, relationships}]
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState(null) // { mode, relativeOf }
  const [connectModal, setConnectModal] = useState(null) // ReactFlow connection object
  const [showMemberList, setShowMemberList] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const reactFlowRef = useRef(null)

  useEffect(() => {
    const h = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setPanelOpen(false)
    }
    window.addEventListener('resize', h)
    if (window.innerWidth < 768) setPanelOpen(false)
    return () => window.removeEventListener('resize', h)
  }, [])

  // Build nodes and edges from data
  const buildGraph = useCallback((personList, relList, onAddRelative) => {
    const newNodes = personList.map(p => ({
      id: String(p.id),
      type: 'person',
      position: { x: p.position_x || 0, y: p.position_y || 0 },
      data: {
        ...p,
        onAddRelative,
      },
    }))

    const newEdges = relList.map(r => {
      const isSpouse = r.relationship_type === 'spouse'
      const p1 = personList.find(p => p.id === r.person1_id)
      const p2 = personList.find(p => p.id === r.person2_id)
      const p1Left = p1 && p2 && (p1.position_x || 0) <= (p2.position_x || 0)
      return {
        id: String(r.id),
        source: String(r.person1_id),
        target: String(r.person2_id),
        type: isSpouse ? 'straight' : 'smoothstep',
        sourceHandle: isSpouse ? (p1Left ? 'right' : 'left') : 'bottom',
        targetHandle: isSpouse ? (p1Left ? 'left' : 'right') : 'top',
        style: edgeStyle[r.relationship_type] || edgeStyle.parent_child,
        data: { relationship_type: r.relationship_type },
      }
    })

    return { newNodes, newEdges }
  }, [])

  const handleAddRelative = useCallback((mode, personId) => {
    const p = persons.find(x => x.id === parseInt(personId))
    setAddModal({ mode, relativeOf: p })
  }, [persons])

  const refreshGraph = useCallback((personList, relList) => {
    const { newNodes, newEdges } = buildGraph(personList, relList, handleAddRelative)
    setNodes(newNodes)
    setEdges(newEdges)
  }, [buildGraph, handleAddRelative, setNodes, setEdges])

  // Fetch tree data
  useEffect(() => {
    apiClient.get(`/trees/${treeId}`)
      .then(res => {
        setTreeData(res.data.tree)
        setPersons(res.data.persons)
        setRelationships(res.data.relationships)
      })
      .catch(err => {
        if (err.response?.status === 404 || err.response?.status === 403) {
          toast.error('Không tìm thấy gia phả')
          navigate('/dashboard')
        } else {
          toast.error('Lỗi tải dữ liệu: ' + (err.response?.data?.detail || err.message))
        }
      })
      .finally(() => setLoading(false))
  }, [treeId, navigate])

  // Rebuild graph when data changes
  useEffect(() => {
    if (persons !== null && relationships !== null) {
      refreshGraph(persons, relationships)
    }
  }, [persons, relationships, refreshGraph])


  const handleNodeClick = useCallback((event, node) => {
    setSelectedPersonId(parseInt(node.id))
  }, [])

  const handleNodeDragStop = useCallback(async (event, node) => {
    try {
      await apiClient.put(`/persons/${node.id}/position`, {
        position_x: node.position.x,
        position_y: node.position.y,
      })
    } catch {
      // silently fail for position saves
    }
  }, [])

  const handleConnect = useCallback((connection) => {
    if (connection.source === connection.target) return
    setConnectModal(connection)
  }, [])

  const handleConfirmConnect = useCallback(async (relType, p1Id, p2Id) => {
    setConnectModal(null)
    try {
      const res = await apiClient.post(`/trees/${treeId}/relationships`, {
        person1_id: p1Id,
        person2_id: p2Id,
        relationship_type: relType,
      })
      setRelationships(prev => [...prev, res.data])
      toast.success('Đã thêm quan hệ')
    } catch (err) {
      toast.error('Lỗi: ' + (err.response?.data?.detail || err.message))
    }
  }, [treeId])

  const handleSavePerson = useCallback((updatedPerson) => {
    setPersons(prev => prev.map(p => p.id === updatedPerson.id ? updatedPerson : p))
  }, [])

  const handleDeletePerson = useCallback(async (personId) => {
    const personToDelete = persons.find(p => p.id === personId)
    const relsToDelete = relationships.filter(r => r.person1_id === personId || r.person2_id === personId)
    try {
      await apiClient.delete(`/persons/${personId}`)
      setUndoStack(prev => [...prev.slice(-9), { person: personToDelete, relationships: relsToDelete }])
      setPersons(prev => prev.filter(p => p.id !== personId))
      setRelationships(prev => prev.filter(r => r.person1_id !== personId && r.person2_id !== personId))
      setSelectedPersonId(null)
      toast.success('Đã xóa — Ctrl+Z để hoàn tác')
    } catch (err) {
      toast.error('Lỗi xóa: ' + (err.response?.data?.detail || err.message))
    }
  }, [persons, relationships])

  const handleUndo = useCallback(async () => {
    if (undoStack.length === 0) { toast('Không có gì để hoàn tác'); return }
    const { person, relationships: rels } = undoStack[undoStack.length - 1]
    try {
      const res = await apiClient.post(`/trees/${treeId}/persons`, {
        full_name: person.full_name, birth_date: person.birth_date,
        death_date: person.death_date, gender: person.gender,
        biography: person.biography, occupation: person.occupation,
        burial_place: person.burial_place,
        position_x: person.position_x, position_y: person.position_y,
      })
      const newPerson = res.data
      const newRels = []
      for (const rel of rels) {
        try {
          const r = await apiClient.post(`/trees/${treeId}/relationships`, {
            person1_id: rel.person1_id === person.id ? newPerson.id : rel.person1_id,
            person2_id: rel.person2_id === person.id ? newPerson.id : rel.person2_id,
            relationship_type: rel.relationship_type,
          })
          newRels.push(r.data)
        } catch { /* quan hệ với node đã xóa, bỏ qua */ }
      }
      setPersons(prev => [...prev, newPerson])
      setRelationships(prev => [...prev, ...newRels])
      setUndoStack(prev => prev.slice(0, -1))
      toast.success(`Đã khôi phục "${newPerson.full_name}"`)
    } catch (err) {
      toast.error('Lỗi khôi phục: ' + (err.response?.data?.detail || err.message))
    }
  }, [undoStack, treeId])

  // Ctrl+Z undo — đặt SAU handleUndo để tránh TDZ
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleUndo])

  const handleAddPerson = useCallback(async (formData, mode, relativeOf) => {
    // Calculate position
    let posX = 100
    let posY = 100
    if (relativeOf) {
      if (mode === 'parent') {
        posX = relativeOf.position_x || 100
        posY = (relativeOf.position_y || 200) - 200
      } else if (mode === 'child') {
        posX = (relativeOf.position_x || 100) + (persons.length % 3) * 220
        posY = (relativeOf.position_y || 100) + 200
      } else if (mode === 'spouse') {
        posX = (relativeOf.position_x || 100) + 220
        posY = relativeOf.position_y || 100
      }
    } else {
      posX = 200
      posY = 200
    }

    try {
      // Create person
      const personRes = await apiClient.post(`/trees/${treeId}/persons`, {
        ...formData,
        position_x: posX,
        position_y: posY,
      })
      const newPerson = personRes.data

      // Create relationship if applicable
      let newRel = null
      if (relativeOf && mode !== 'first' && mode !== 'standalone') {
        let p1Id, p2Id, relType
        if (mode === 'parent') {
          p1Id = newPerson.id
          p2Id = relativeOf.id
          relType = 'parent_child'
        } else if (mode === 'child') {
          p1Id = relativeOf.id
          p2Id = newPerson.id
          relType = 'parent_child'
        } else if (mode === 'spouse') {
          p1Id = relativeOf.id
          p2Id = newPerson.id
          relType = 'spouse'
        }

        const relRes = await apiClient.post(`/trees/${treeId}/relationships`, {
          person1_id: p1Id,
          person2_id: p2Id,
          relationship_type: relType,
        })
        newRel = relRes.data
      }

      setPersons(prev => [...prev, newPerson])
      if (newRel) {
        setRelationships(prev => [...prev, newRel])
      }

      toast.success(`Đã thêm ${newPerson.full_name}`)
    } catch (err) {
      toast.error('Lỗi thêm thành viên: ' + (err.response?.data?.detail || err.message))
      throw err
    }
  }, [treeId, persons])

  const getExportDataUrl = useCallback(async () => {
    const nodeList = getNodes()
    if (nodeList.length === 0) throw new Error('Không có dữ liệu để xuất')
    const bounds = getNodesBounds(nodeList)
    const padding = 40
    const W = bounds.width + padding * 2
    const H = bounds.height + padding * 2
    const viewport = getViewportForBounds(bounds, W, H, 0.5, 2, padding)
    const flowEl = document.querySelector('.react-flow__viewport')
    if (!flowEl) throw new Error('Không tìm thấy canvas')
    return toPng(flowEl, {
      backgroundColor: '#F5F0E8',
      width: W,
      height: H,
      style: {
        width: W,
        height: H,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
      filter: (node) => {
        // Skip elements that cause CORS issues
        if (node.tagName === 'LINK' || node.tagName === 'STYLE') return false
        return true
      },
    })
  }, [getNodes, treeData])

  // Export PNG
  const handleExportPNG = useCallback(async () => {
    const t = toast.loading('Đang xuất ảnh...')
    try {
      const dataUrl = await getExportDataUrl()
      const link = document.createElement('a')
      link.download = `${treeData?.name || 'gia-pha'}.png`
      link.href = dataUrl
      link.click()
      toast.dismiss(t)
      toast.success('Xuất PNG thành công!')
    } catch (err) {
      toast.dismiss(t)
      toast.error('Xuất PNG thất bại: ' + err.message)
    }
  }, [getExportDataUrl, treeData])

  // Export PDF
  const handleExportPDF = useCallback(async () => {
    const t = toast.loading('Đang xuất PDF...')
    try {
      const dataUrl = await getExportDataUrl()
      const img = new Image()
      img.src = dataUrl
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width, img.height],
      })
      pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height)
      pdf.save(`${treeData?.name || 'gia-pha'}.pdf`)
      toast.dismiss(t)
      toast.success('Xuất PDF thành công!')
    } catch (err) {
      toast.dismiss(t)
      toast.error('Xuất PDF thất bại: ' + err.message)
    }
  }, [getExportDataUrl, treeData])

  const handleAutoLayout = useCallback(async () => {
    if (persons.length === 0) return
    const STEP_X = 240  // khoảng cách ngang giữa các node
    const STEP_Y = 200  // khoảng cách dọc giữa các thế hệ

    // Xây dựng bảng quan hệ
    const childrenOf = {}
    const spousesOf = {}
    persons.forEach(p => { childrenOf[p.id] = []; spousesOf[p.id] = [] })
    relationships.forEach(rel => {
      if (rel.relationship_type === 'parent_child') {
        childrenOf[rel.person1_id].push(rel.person2_id)
      } else if (rel.relationship_type === 'spouse') {
        spousesOf[rel.person1_id].push(rel.person2_id)
        spousesOf[rel.person2_id].push(rel.person1_id)
      }
    })

    // Gom từng người vào "đơn vị gia đình" (couple unit)
    // Mỗi couple = 1 hoặc 2 người + danh sách con chung
    const personCouple = {}   // personId → coupleKey
    const coupleData = {}     // coupleKey → { members, childIds }
    const processed = new Set()

    persons.forEach(p => {
      if (processed.has(p.id)) return
      processed.add(p.id)
      const spouse = spousesOf[p.id].find(s => !processed.has(s))
      if (spouse) processed.add(spouse)
      const key = String(p.id)
      const members = spouse ? [p.id, spouse] : [p.id]
      const childIds = [...new Set([
        ...childrenOf[p.id],
        ...(spouse ? childrenOf[spouse] : []),
      ])]
      members.forEach(m => { personCouple[m] = key })
      coupleData[key] = { members, childIds }
    })

    // Xây dựng cây couple
    const coupleChildren = {}
    const coupleParents = {}
    Object.keys(coupleData).forEach(k => { coupleChildren[k] = []; coupleParents[k] = [] })
    Object.entries(coupleData).forEach(([key, { childIds }]) => {
      const childKeys = [...new Set(childIds.map(c => personCouple[c]).filter(k => k && k !== key))]
      childKeys.forEach(ck => {
        if (!coupleChildren[key].includes(ck)) coupleChildren[key].push(ck)
        if (!coupleParents[ck].includes(key)) coupleParents[ck].push(key)
      })
    })

    const rootCouples = Object.keys(coupleData).filter(k => coupleParents[k].length === 0)

    // Tính chiều rộng của cây con (để căn giữa)
    const widthCache = {}
    function getWidth(k) {
      if (widthCache[k] !== undefined) return widthCache[k]
      widthCache[k] = 0
      const selfW = coupleData[k].members.length * STEP_X
      const childW = coupleChildren[k].reduce((s, ck) => s + getWidth(ck), 0)
      widthCache[k] = Math.max(selfW, childW)
      return widthCache[k]
    }

    // Đặt vị trí đệ quy: cha/mẹ căn giữa trên các con
    const positions = {}
    const placed = new Set()

    function placeCouple(k, centerX, depth) {
      if (placed.has(k)) return
      placed.add(k)
      const { members } = coupleData[k]
      const y = depth * STEP_Y
      if (members.length >= 2) {
        positions[members[0]] = { x: centerX - STEP_X, y }
        positions[members[1]] = { x: centerX, y }
      } else {
        positions[members[0]] = { x: centerX - STEP_X / 2, y }
      }
      const childKeys = coupleChildren[k].filter(ck => !placed.has(ck))
      if (childKeys.length === 0) return
      const widths = childKeys.map(ck => getWidth(ck))
      const total = widths.reduce((a, b) => a + b, 0)
      let x = centerX - total / 2
      childKeys.forEach((ck, i) => {
        placeCouple(ck, x + widths[i] / 2, depth + 1)
        x += widths[i]
      })
    }

    // Đặt các gốc (root couples) cạnh nhau, căn giữa tổng thể
    const rootWidths = rootCouples.map(k => getWidth(k))
    const totalW = rootWidths.reduce((a, b) => a + b, 0)
    let x = -totalW / 2
    rootCouples.forEach((k, i) => {
      placeCouple(k, x + rootWidths[i] / 2, 0)
      x += rootWidths[i]
    })

    // Xử lý node chưa được đặt (nếu có node không kết nối)
    persons.forEach((p, i) => {
      if (!positions[p.id]) positions[p.id] = { x: i * STEP_X - totalW / 2, y: -STEP_Y }
    })

    // Cập nhật state
    const updated = persons.map(p => ({
      ...p,
      position_x: positions[p.id].x,
      position_y: positions[p.id].y,
    }))
    setPersons(updated)
    toast.success('Đã căn chỉnh bố cục')
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50)

    // Lưu vị trí lên server
    updated.forEach(p => {
      apiClient.put(`/persons/${p.id}/position`, {
        position_x: p.position_x,
        position_y: p.position_y,
      }).catch(() => {})
    })
  }, [persons, relationships, fitView])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)', background: '#F5F0E8' }}>
        <div className="text-center">
          <div className="spinner mx-auto" style={{ width: '2.5rem', height: '2.5rem' }}></div>
          <p style={{ color: '#8B4513', marginTop: '12px', fontFamily: 'Lora, Georgia, serif' }}>Đang tải gia phả...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* React Flow canvas */}
      <div style={{ flex: 1, position: 'relative' }} ref={reactFlowRef}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onNodeDragStop={handleNodeDragStop}
          onConnect={handleConnect}
          connectionMode="loose"
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          style={{ background: '#f0ead8' }}
          deleteKeyCode={null}
        >
          <Background color="#c4a882" variant="dots" gap={24} size={1.5} />
          <Controls
            style={{
              background: '#FDFAF5',
              border: '1px solid #C4A882',
            }}
          />
          <MiniMap
            nodeColor={(node) => {
              if (node.data?.gender === 'male') return '#4A90D9'
              if (node.data?.gender === 'female') return '#D946A8'
              return '#8B4513'
            }}
            style={{ border: '1px solid #C4A882', background: '#FDFAF5' }}
          />

          {/* Mobile toggle button */}
          {isMobile && (
            <Panel position="top-left">
              <button onClick={() => setPanelOpen(v => !v)} style={{
                background: '#FDFAF5', border: '1px solid #C4A882', borderRadius: 8,
                padding: '8px 12px', fontSize: '0.78rem', cursor: 'pointer',
                fontFamily: 'Lora,Georgia,serif', fontWeight: 700, color: '#3C2415',
                boxShadow: '2px 4px 12px rgba(60,36,21,0.18)',
              }}>
                {panelOpen ? '✕ Đóng' : '☰ Menu'}
              </button>
            </Panel>
          )}

          {/* Top-left panel */}
          {(!isMobile || panelOpen) && (
          <Panel position={isMobile ? 'top-left' : 'top-left'}>
            <div style={{
              background: '#FDFAF5', border: '1px solid #C4A882',
              borderRadius: '10px', width: isMobile ? '180px' : '208px',
              boxShadow: '2px 4px 12px rgba(60,36,21,0.18)',
              fontFamily: 'Lora, Georgia, serif', overflow: 'hidden',
              marginTop: isMobile ? '40px' : '0',
            }}>
              {/* Tree info */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #E8E0D0', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>🌳</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '0.88rem', fontWeight: 700, color: '#3C2415', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {treeData?.name}
                  </div>
                  <div style={{ fontSize: '0.67rem', color: '#7a5c3e' }}>
                    {persons.length} thành viên · {relationships.length} quan hệ
                  </div>
                </div>
              </div>

              {/* Primary actions */}
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #E8E0D0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                {[
                  { label: '+ Thành viên', bg: '#3A5F8A', onClick: () => setAddModal({ mode: 'standalone', relativeOf: null }), title: 'Thêm người mới' },
                  { label: '📋 Danh sách', bg: '#5C4033', onClick: () => setShowMemberList(true), title: 'Xem toàn bộ thành viên' },
                ].map(b => (
                  <button key={b.label} onClick={b.onClick} title={b.title} style={{
                    background: b.bg, color: '#F5F0E8', border: 'none', borderRadius: '5px',
                    padding: '6px 4px', fontSize: '0.72rem', cursor: 'pointer',
                    fontFamily: 'Lora, Georgia, serif', fontWeight: 600, textAlign: 'center',
                  }}>{b.label}</button>
                ))}
              </div>

              {/* Tools */}
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #E8E0D0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                <button onClick={handleAutoLayout} title="Căn chỉnh tự động" style={{
                  background: '#4A6741', color: '#F5F0E8', border: 'none', borderRadius: '5px',
                  padding: '6px 4px', fontSize: '0.72rem', cursor: 'pointer',
                  fontFamily: 'Lora, Georgia, serif', fontWeight: 600,
                }}>✨ Làm đẹp</button>
                <button onClick={handleUndo} disabled={undoStack.length === 0} title="Hoàn tác (Ctrl+Z)" style={{
                  background: undoStack.length > 0 ? '#8B4513' : '#C4A882',
                  color: '#F5F0E8', border: 'none', borderRadius: '5px',
                  padding: '6px 4px', fontSize: '0.72rem',
                  cursor: undoStack.length > 0 ? 'pointer' : 'not-allowed',
                  fontFamily: 'Lora, Georgia, serif', fontWeight: 600,
                }}>↩ Hoàn tác</button>
              </div>

              {/* Export + back */}
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #E8E0D0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
                {[
                  { label: '📷 PNG', bg: '#2D5016', onClick: handleExportPNG },
                  { label: '📄 PDF', bg: '#7B3A10', onClick: handleExportPDF },
                  { label: '← Về', bg: 'transparent', color: '#8B4513', border: '1px solid #C4A882', onClick: () => navigate('/dashboard') },
                ].map(b => (
                  <button key={b.label} onClick={b.onClick} style={{
                    background: b.bg ?? '#transparent',
                    color: b.color ?? '#F5F0E8',
                    border: b.border ?? 'none',
                    borderRadius: '5px', padding: '5px 2px',
                    fontSize: '0.68rem', cursor: 'pointer',
                    fontFamily: 'Lora, Georgia, serif', fontWeight: 600, textAlign: 'center',
                  }}>{b.label}</button>
                ))}
              </div>

              {/* Print order */}
              <div style={{ padding: '8px 10px' }}>
                <button onClick={() => setShowPrintModal(true)} title="Đặt in tranh gia phả" style={{
                  width: '100%', background: 'linear-gradient(135deg, #6b3a7d, #9b4dca)',
                  color: '#F5F0E8', border: 'none', borderRadius: '5px',
                  padding: '7px 4px', fontSize: '0.72rem', cursor: 'pointer',
                  fontFamily: 'Lora, Georgia, serif', fontWeight: 600, textAlign: 'center',
                }}>🖨 Đặt in tranh</button>
              </div>
            </div>
          </Panel>
          )}

          {/* Top-right panel: add first person (when empty) or legend */}
          <Panel position="top-right">
            <div
              style={{
                background: '#FDFAF5',
                border: '1px solid #C4A882',
                borderRadius: '8px',
                padding: '8px 12px',
                boxShadow: '2px 2px 8px rgba(60,36,21,0.15)',
              }}
            >
              {persons.length === 0 ? (
                <button
                  onClick={() => setAddModal({ mode: 'first', relativeOf: null })}
                  className="btn-primary"
                  style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                >
                  + Thêm Người Đầu Tiên
                </button>
              ) : (
                <div style={{ fontSize: '0.72rem', color: '#7a5c3e', lineHeight: 2 }}>
                  <div style={{ fontWeight: 700, color: '#3C2415', marginBottom: '2px', fontSize: '0.78rem' }}>Chú giải</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '20px', height: '2px', background: '#8B4513' }}></div>
                    Cha/con
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '20px', height: '2px', background: '#D946A8', borderTop: '2px dashed #D946A8' }}></div>
                    Vợ/chồng
                  </div>
                  <div style={{ marginTop: '4px', borderTop: '1px solid #E8E0D0', paddingTop: '4px' }}>
                    Click node để xem & sửa<br />
                    Kéo từ handle ● sang node<br />khác để tạo quan hệ tự do
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Right sidebar - person details */}
      {selectedPerson && (
        <PersonSidebar
          person={selectedPerson}
          relationships={relationships}
          persons={persons}
          onClose={() => setSelectedPersonId(null)}
          onSave={handleSavePerson}
          onDelete={handleDeletePerson}
          onAddRelative={(mode) => setAddModal({ mode, relativeOf: selectedPerson })}
        />
      )}

      {/* Add Person Modal */}
      {addModal && (
        <AddPersonModal
          mode={addModal.mode}
          relativeOf={addModal.relativeOf}
          onClose={() => setAddModal(null)}
          onAdd={handleAddPerson}
        />
      )}

      {/* Connect Relationship Modal */}
      {connectModal && (
        <ConnectModal
          connection={connectModal}
          persons={persons}
          onClose={() => setConnectModal(null)}
          onConfirm={handleConfirmConnect}
        />
      )}

      {/* Member List Modal */}
      {showMemberList && (
        <MemberListModal
          persons={persons}
          onClose={() => setShowMemberList(false)}
          onEdit={(person) => {
            setSelectedPersonId(person.id)
            setShowMemberList(false)
          }}
          onDelete={(personId) => {
            handleDeletePerson(personId)
            if (persons.length <= 1) setShowMemberList(false)
          }}
          onAdd={() => {
            setShowMemberList(false)
            setAddModal({ mode: 'standalone', relativeOf: null })
          }}
        />
      )}

      {/* Print Order Modal */}
      {showPrintModal && (
        <PrintOrderModal
          onClose={() => setShowPrintModal(false)}
          treeId={treeData?.id}
          treeName={treeData?.name}
          getTreeImage={getExportDataUrl}
        />
      )}
    </div>
  )
}

export default function TreeEditor() {
  return (
    <ReactFlowProvider>
      <TreeEditorInner />
    </ReactFlowProvider>
  )
}
