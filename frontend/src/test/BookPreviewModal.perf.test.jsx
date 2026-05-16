import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { act } from 'react'
import BookPreviewModal from '../components/BookPreviewModal'

// ── Mock data generators ─────────────────────────────────────────────────────

function makePerson(i) {
  const genders = ['male', 'female', 'unknown']
  return {
    id: i,
    full_name: `Thành Viên Số ${i}`,
    nickname: i % 3 === 0 ? `Biệt danh ${i}` : null,
    gender: genders[i % 3],
    birth_date: `${1900 + (i % 100)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    death_date: i % 5 === 0 ? `${1950 + (i % 70)}-01-01` : null,
    occupation: i % 2 === 0 ? `Nghề nghiệp ${i}` : null,
    biography: i % 4 === 0 ? `Tiểu sử của thành viên số ${i}. Đây là mô tả ngắn về cuộc đời của người này.` : null,
    burial_place: i % 7 === 0 ? `Quê quán ${i}` : null,
    photo_url: null,
    position_x: i * 200,
    position_y: Math.floor(i / 5) * 200,
  }
}

function makeRelationships(persons) {
  const rels = []
  let id = 1

  // Spouse pairs: (0,1), (2,3), (4,5) ...
  for (let i = 0; i + 1 < persons.length; i += 4) {
    rels.push({ id: id++, person1_id: persons[i].id, person2_id: persons[i + 1].id, relationship_type: 'spouse' })
  }

  // Parent-child: every pair (0→2), (1→3), (2→4) ...
  for (let i = 0; i + 2 < persons.length; i += 2) {
    rels.push({ id: id++, person1_id: persons[i].id, person2_id: persons[i + 2].id, relationship_type: 'parent_child' })
  }

  return rels
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildProps(count) {
  const persons = Array.from({ length: count }, (_, i) => makePerson(i + 1))
  return {
    onClose: vi.fn(),
    treeData: { id: 1, name: `Gia Phả Test (${count} người)`, description: 'Test description' },
    persons,
    relationships: makeRelationships(persons),
    getTreeImage: vi.fn().mockResolvedValue('data:image/png;base64,iVBORw0KGgo='),
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BookPreviewModal — hiệu năng theo số lượng thành viên', () => {
  const SIZES = [10, 50, 100, 200, 300, 500]
  const results = []

  beforeEach(() => {
    vi.clearAllMocks()
  })

  SIZES.forEach(count => {
    // Timeout tăng dần theo kích thước dữ liệu
    const timeout = count <= 100 ? 10000 : count <= 200 ? 20000 : 60000

    it(`render ${count} thành viên trong thời gian chấp nhận được`, async () => {
      const props = buildProps(count)
      const start = performance.now()

      let container
      await act(async () => {
        ;({ container } = render(<BookPreviewModal {...props} />))
      })

      const elapsed = performance.now() - start
      results.push({ count, ms: Math.round(elapsed) })

      // Bìa có tên cây
      expect(container.textContent).toContain(`Gia Phả Test (${count} người)`)

      // Preview chỉ render 1 trang (trang bìa), print root lazy (rỗng lúc mở)
      const pages = container.querySelectorAll('.book-page')
      expect(pages.length).toBe(1) // chỉ 1 trang preview

      // Print root phải rỗng (chưa bấm print)
      const printRoot = container.querySelector('#book-print-root')
      expect(printRoot.childElementCount).toBe(0)

      // Thời gian render trang đầu phải nhanh (< 2s bất kể số lượng thành viên)
      expect(elapsed).toBeLessThan(2000)

      console.log(`  ✓ ${count} thành viên → render ${Math.round(elapsed)}ms`)
    }, timeout)
  })

  // In bảng tổng kết sau tất cả test
  it('tổng kết hiệu năng', () => {
    if (results.length === 0) return
    console.log('\n  ┌─────────────────────────────────────┐')
    console.log('  │  Kết quả render BookPreviewModal     │')
    console.log('  ├──────────────┬───────────┬───────────┤')
    console.log('  │ Thành viên   │ Thời gian │ Trạng thái│')
    console.log('  ├──────────────┼───────────┼───────────┤')
    results.forEach(({ count, ms }) => {
      const status = ms < 3000 ? '  OK  ' : ' CHẬM '
      console.log(`  │ ${String(count).padEnd(12)} │ ${String(ms + 'ms').padEnd(9)} │ ${status}  │`)
    })
    console.log('  └──────────────┴───────────┴───────────┘')
    expect(true).toBe(true)
  })
})

describe('BookPreviewModal — kiểm tra nội dung từng trang', () => {
  it('trang bìa hiển thị tên và năm', async () => {
    const props = buildProps(5)
    let container
    await act(async () => {
      ;({ container } = render(<BookPreviewModal {...props} />))
    })
    const pages = container.querySelectorAll('.book-page')
    const coverText = pages[0].textContent
    expect(coverText).toContain('Gia Phả Test (5 người)')
    expect(coverText).toContain(String(new Date().getFullYear()))
  })

  it('mục lục liệt kê đúng số thành viên', async () => {
    const props = buildProps(8)
    let container
    await act(async () => {
      ;({ container } = render(<BookPreviewModal {...props} />))
    })
    // Chuyển sang trang 1 (mục lục) bằng cách tìm select và change
    const select = container.querySelector('select')
    await act(async () => {
      select.value = '1'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const pages = container.querySelectorAll('.book-page')
    // pages[0] là trang preview hiện tại (mục lục)
    expect(pages[0].textContent).toContain('8 thành viên')
  })

  it('trang thành viên có đủ thông tin', async () => {
    const persons = [
      {
        id: 1, full_name: 'Nguyễn Văn A', nickname: 'Bác A',
        gender: 'male', birth_date: '1950-03-15', death_date: '2020-07-01',
        occupation: 'Nông dân', biography: 'Một cuộc đời bình dị.',
        burial_place: 'Hà Nội', photo_url: null, position_x: 0, position_y: 0,
      },
      {
        id: 2, full_name: 'Trần Thị B', nickname: null,
        gender: 'female', birth_date: '1955-06-20', death_date: null,
        occupation: null, biography: null, burial_place: null, photo_url: null,
        position_x: 200, position_y: 0,
      },
    ]
    const relationships = [{ id: 1, person1_id: 1, person2_id: 2, relationship_type: 'spouse' }]
    const props = {
      onClose: vi.fn(),
      treeData: { id: 1, name: 'Test', description: '' },
      persons, relationships,
      getTreeImage: vi.fn().mockResolvedValue('data:image/png;base64,test'),
    }

    let container
    await act(async () => {
      ;({ container } = render(<BookPreviewModal {...props} />))
    })

    // Navigate đến trang người đầu tiên (index 3 = cover+toc+diagram+person1)
    const select = container.querySelector('select')
    await act(async () => {
      select.value = '3'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const pageText = container.querySelector('.book-page').textContent
    expect(pageText).toContain('Nguyễn Văn A')
    expect(pageText).toContain('Bác A')
    expect(pageText).toContain('Nông dân')
    expect(pageText).toContain('Một cuộc đời bình dị.')
    expect(pageText).toContain('Trần Thị B') // vợ/chồng
  })

  it('quan hệ cha/mẹ → con được hiển thị đúng', async () => {
    const persons = [
      { id: 1, full_name: 'Bố', gender: 'male', birth_date: null, death_date: null, occupation: null, biography: null, burial_place: null, photo_url: null, position_x: 0, position_y: 0 },
      { id: 2, full_name: 'Mẹ', gender: 'female', birth_date: null, death_date: null, occupation: null, biography: null, burial_place: null, photo_url: null, position_x: 200, position_y: 0 },
      { id: 3, full_name: 'Con', gender: 'male', birth_date: null, death_date: null, occupation: null, biography: null, burial_place: null, photo_url: null, position_x: 100, position_y: 200 },
    ]
    const relationships = [
      { id: 1, person1_id: 1, person2_id: 2, relationship_type: 'spouse' },
      { id: 2, person1_id: 1, person2_id: 3, relationship_type: 'parent_child' },
      { id: 3, person1_id: 2, person2_id: 3, relationship_type: 'parent_child' },
    ]
    const props = {
      onClose: vi.fn(),
      treeData: { id: 1, name: 'Test', description: '' },
      persons, relationships,
      getTreeImage: vi.fn().mockResolvedValue('data:image/png;base64,test'),
    }

    let container
    await act(async () => {
      ;({ container } = render(<BookPreviewModal {...props} />))
    })

    const text = container.textContent
    // Trang "Bố" phải thấy "Con" trong danh sách con
    expect(text).toContain('Con')
    // Trang "Con" phải thấy "Bố" và "Mẹ" trong cha/mẹ
    expect(text).toContain('Bố')
    expect(text).toContain('Mẹ')
  })
})
