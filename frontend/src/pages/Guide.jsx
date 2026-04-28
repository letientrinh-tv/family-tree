import React from 'react'
import { Link } from 'react-router-dom'

const steps = [
  {
    number: '01',
    icon: '📝',
    title: 'Đăng Ký Tài Khoản',
    desc: 'Tạo tài khoản miễn phí với email và mật khẩu. Quá trình đăng ký chỉ mất vài giây.',
    color: '#8B4513',
    bg: '#FDF5EE',
  },
  {
    number: '02',
    icon: '🌳',
    title: 'Tạo Cây Gia Phả',
    desc: 'Từ Dashboard, nhấn "Tạo Cây Mới". Đặt tên cho gia phả của bạn, ví dụ: "Gia Phả Họ Trần" và thêm mô tả.',
    color: '#2D5016',
    bg: '#F0F7E8',
  },
  {
    number: '03',
    icon: '👥',
    title: 'Thêm Thành Viên',
    desc: 'Nhấn vào biểu tượng + trên mỗi người để thêm cha/mẹ, vợ/chồng hoặc con cái. Điền thông tin: tên, ngày sinh, nghề nghiệp, ảnh...',
    color: '#4a3000',
    bg: '#FDF3E3',
  },
  {
    number: '04',
    icon: '🔗',
    title: 'Kết Nối Quan Hệ',
    desc: 'Sử dụng các nút mũi tên để tạo quan hệ cha-con hoặc vợ-chồng giữa các thành viên. Kéo thả để sắp xếp vị trí trên sơ đồ.',
    color: '#7a3d11',
    bg: '#FDF5EE',
  },
  {
    number: '05',
    icon: '📸',
    title: 'Thêm Ảnh & Tiểu Sử',
    desc: 'Nhấn vào từng thành viên để mở panel chỉnh sửa. Upload ảnh chân dung và ghi chép tiểu sử, cuộc đời của họ.',
    color: '#2D5016',
    bg: '#F0F7E8',
  },
  {
    number: '06',
    icon: '📄',
    title: 'Xuất Gia Phả',
    desc: 'Khi hoàn thành, nhấn nút Export PNG hoặc Export PDF để tải về file chất lượng cao, dùng để in hoặc chia sẻ với người thân.',
    color: '#8B4513',
    bg: '#FDF5EE',
  },
]

export default function Guide() {
  return (
    <div className="fade-in" style={{ background: '#F5F0E8', minHeight: '100vh' }}>
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3C2415 0%, #8B4513 100%)',
          padding: '60px 20px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: '2.5rem',
            color: '#F5F0E8',
            marginBottom: '12px',
          }}
        >
          Hướng Dẫn Sử Dụng
        </h1>
        <p style={{ color: '#d4c5a9', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto' }}>
          Từng bước xây dựng gia phả dòng họ của bạn một cách dễ dàng
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {steps.map((step, idx) => (
            <div
              key={step.number}
              style={{
                display: 'flex',
                gap: '24px',
                alignItems: 'flex-start',
                flexDirection: idx % 2 === 1 ? 'row-reverse' : 'row',
              }}
              className="vintage-card p-6"
            >
              {/* Illustration */}
              <div
                style={{
                  width: '120px',
                  minWidth: '120px',
                  height: '120px',
                  borderRadius: '12px',
                  background: step.bg,
                  border: `2px solid ${step.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3.5rem',
                }}
              >
                {step.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'Playfair Display, Georgia, serif',
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: `${step.color}40`,
                    }}
                  >
                    {step.number}
                  </span>
                  <h3
                    style={{
                      fontFamily: 'Playfair Display, Georgia, serif',
                      fontSize: '1.3rem',
                      fontWeight: 700,
                      color: step.color,
                      margin: 0,
                    }}
                  >
                    {step.title}
                  </h3>
                </div>
                <p style={{ color: '#5a3820', lineHeight: 1.8, fontSize: '0.95rem', margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tips section */}
        <div
          className="vintage-card"
          style={{ marginTop: '40px', padding: '24px', background: '#FDFAF5' }}
        >
          <h3
            style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '1.3rem',
              color: '#8B4513',
              marginBottom: '12px',
            }}
          >
            💡 Mẹo Hữu Ích
          </h3>
          <ul style={{ color: '#5a3820', lineHeight: 2, paddingLeft: '20px', margin: 0 }}>
            <li>Bắt đầu từ thế hệ lớn nhất mà bạn biết, sau đó thêm dần xuống các thế hệ trẻ hơn</li>
            <li>Sử dụng tính năng kéo-thả để sắp xếp sơ đồ sao cho dễ nhìn nhất</li>
            <li>Thêm ảnh cho mỗi người sẽ làm gia phả trở nên sinh động và ý nghĩa hơn</li>
            <li>Ghi chép tiểu sử càng chi tiết, gia phả càng có giá trị lịch sử</li>
            <li>Xuất PDF để in và lưu trữ bản cứng cho con cháu</li>
          </ul>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ color: '#5a3820', marginBottom: '16px', fontSize: '1rem' }}>
            Sẵn sàng xây dựng gia phả của bạn?
          </p>
          <Link
            to="/register"
            style={{
              display: 'inline-block',
              background: '#8B4513',
              color: '#F5F0E8',
              padding: '12px 32px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none',
              fontFamily: 'Lora, Georgia, serif',
              border: '1px solid #7a3d11',
            }}
          >
            Bắt Đầu Ngay →
          </Link>
        </div>
      </div>
    </div>
  )
}
