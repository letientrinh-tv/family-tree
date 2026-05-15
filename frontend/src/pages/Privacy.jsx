import React from 'react'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-secondary py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white border border-primary-200 rounded-xl p-8 shadow-sm">
        <div className="border-b border-primary-200 pb-6 mb-8">
          <h1 className="text-3xl font-serif font-bold text-primary-800 mb-1">Chính Sách Quyền Riêng Tư</h1>
          <p className="text-sm text-primary-400">Cập nhật lần cuối: 15/05/2026</p>
        </div>

        <div className="prose prose-stone max-w-none font-serif text-primary-700 space-y-6">

          <section>
            <h2 className="text-xl font-bold text-primary-800 mb-2">1. Giới thiệu</h2>
            <p>
              Gia Phả Việt ("chúng tôi") cung cấp dịch vụ lưu trữ và quản lý gia phả trực tuyến tại Việt Nam.
              Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn khi
              sử dụng ứng dụng và các dịch vụ liên quan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary-800 mb-2">2. Thông tin chúng tôi thu thập</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Thông tin tài khoản: tên, địa chỉ email, mật khẩu (đã mã hóa).</li>
              <li>Thông tin gia phả: họ tên, ngày sinh, ngày mất, ảnh và quan hệ gia đình mà bạn tự nhập.</li>
              <li>Thông tin đăng nhập qua Facebook: tên hiển thị, ảnh đại diện, email công khai (nếu bạn chọn đăng nhập bằng Facebook).</li>
              <li>Dữ liệu sử dụng: nhật ký truy cập, địa chỉ IP, loại trình duyệt.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary-800 mb-2">3. Mục đích sử dụng thông tin</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Cung cấp và vận hành dịch vụ gia phả.</li>
              <li>Gửi thông báo nhắc nhở sự kiện (sinh nhật, ngày giỗ) theo cài đặt của bạn.</li>
              <li>Cải thiện trải nghiệm người dùng và bảo mật hệ thống.</li>
              <li>Liên lạc khi cần thiết liên quan đến tài khoản.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary-800 mb-2">4. Chia sẻ thông tin</h2>
            <p>
              Chúng tôi <strong>không bán, không cho thuê</strong> thông tin cá nhân của bạn cho bên thứ ba.
              Thông tin chỉ được chia sẻ trong các trường hợp:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Khi pháp luật yêu cầu hoặc theo lệnh của cơ quan có thẩm quyền.</li>
              <li>Với các nhà cung cấp dịch vụ kỹ thuật (hosting, email) để vận hành ứng dụng, theo hợp đồng bảo mật.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary-800 mb-2">5. Đăng nhập qua Facebook</h2>
            <p>
              Khi bạn chọn đăng nhập bằng Facebook, chúng tôi chỉ yêu cầu quyền truy cập thông tin công khai
              (tên, ảnh đại diện, email). Chúng tôi không đăng bài, không đọc tin nhắn, không truy cập danh
              sách bạn bè của bạn. Bạn có thể thu hồi quyền truy cập bất kỳ lúc nào tại cài đặt Facebook.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary-800 mb-2">6. Bảo mật dữ liệu</h2>
            <p>
              Dữ liệu được lưu trữ trên máy chủ bảo mật với mã hóa SSL/TLS. Mật khẩu được mã hóa một chiều
              (bcrypt) và không ai có thể đọc được, kể cả chúng tôi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary-800 mb-2">7. Quyền của bạn</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Xem, chỉnh sửa hoặc xóa thông tin cá nhân trong tài khoản.</li>
              <li>Yêu cầu xóa toàn bộ dữ liệu bằng cách liên hệ chúng tôi.</li>
              <li>Tắt thông báo email bất kỳ lúc nào trong mục Cài đặt thông báo.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary-800 mb-2">8. Xóa dữ liệu</h2>
            <p>
              Để yêu cầu xóa toàn bộ dữ liệu liên quan đến tài khoản của bạn, vui lòng gửi email đến{' '}
              <a href="mailto:trinhlt@nal.vn" className="text-primary-600 underline">trinhlt@nal.vn</a>{' '}
              với tiêu đề <em>"Yêu cầu xóa dữ liệu"</em>. Chúng tôi sẽ xử lý trong vòng 7 ngày làm việc.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary-800 mb-2">9. Thay đổi chính sách</h2>
            <p>
              Chúng tôi có thể cập nhật chính sách này theo thời gian. Khi có thay đổi quan trọng, chúng tôi
              sẽ thông báo qua email hoặc thông báo trên ứng dụng.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-primary-800 mb-2">10. Liên hệ</h2>
            <p>
              Nếu có câu hỏi về chính sách quyền riêng tư, vui lòng liên hệ:{' '}
              <a href="mailto:trinhlt@nal.vn" className="text-primary-600 underline">trinhlt@nal.vn</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
