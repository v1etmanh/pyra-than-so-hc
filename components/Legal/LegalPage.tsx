import Link from 'next/link';

type LegalPageProps = { locale: string; kind: 'privacy' | 'terms' };

export function LegalPage({ locale, kind }: LegalPageProps) {
  const vi = locale === 'vi';
  const privacy = kind === 'privacy';
  return (
    <main className="legal-page">
      <div className="legal-page-inner">
        <Link className="legal-back" href={vi ? '/' : '/en/'}>← NUMINA</Link>
        <p className="batch-kicker">NUMINA / {privacy ? 'PRIVACY' : 'TERMS'}</p>
        <h1>{privacy ? (vi ? 'Chính sách riêng tư' : 'Privacy Policy') : (vi ? 'Điều khoản sử dụng' : 'Terms of Service')}</h1>
        <p className="legal-updated">{vi ? 'Cập nhật lần cuối: 02/09/2026' : 'Last updated: September 2, 2026'}</p>
        {privacy ? (
          <>
            <section><h2>{vi ? '1. Dữ liệu chúng tôi nhận' : '1. Data we collect'}</h2><p>{vi ? 'Numina có thể nhận họ tên, ngày sinh, câu hỏi, hồ sơ thần số học, email tài khoản và phản hồi bạn chủ động cung cấp.' : 'Numina may receive your name, date of birth, questions, numerology profiles, account email, and feedback you choose to provide.'}</p></section>
            <section><h2>{vi ? '2. Cách sử dụng dữ liệu' : '2. How data is used'}</h2><p>{vi ? 'Dữ liệu được dùng để tính chỉ số, lưu hồ sơ, tạo lời giải cá nhân hóa, hỗ trợ tài khoản và cải thiện sản phẩm. Nội dung AI có thể được gửi tới nhà cung cấp mô hình được cấu hình cho phiên làm việc.' : 'Data is used to calculate indicators, save profiles, create personalized readings, support accounts, and improve the product. AI prompts may be sent to the model provider configured for the session.'}</p></section>
            <section><h2>{vi ? '3. Lưu trữ và bên thứ ba' : '3. Storage and third parties'}</h2><p>{vi ? 'Hồ sơ khách được lưu trên thiết bị. Khi đăng nhập, hồ sơ có thể được đồng bộ với Supabase. Nếu bạn đồng ý, Numina dùng Google Analytics với IP ẩn danh và không gửi ngày sinh nguyên bản vào sự kiện analytics.' : 'Guest profiles are stored on your device. When signed in, profiles may sync with Supabase. If you consent, Numina uses Google Analytics with IP anonymization and does not send raw birth dates in analytics events.'}</p></section>
            <section><h2>{vi ? '4. Quyền của bạn' : '4. Your choices'}</h2><p>{vi ? 'Bạn có thể từ chối analytics, xóa hồ sơ cục bộ, yêu cầu xóa tài khoản và dữ liệu đồng bộ từ trang tài khoản. Dữ liệu do nhà cung cấp AI hoặc thanh toán xử lý có thể chịu chính sách riêng của họ.' : 'You may reject analytics, delete local profiles, and request deletion of your account and synced data from the account page. Data processed by AI or payment providers may also be subject to their own policies.'}</p></section>
            <section><h2>{vi ? '5. Liên hệ' : '5. Contact'}</h2><p>{vi ? 'Liên hệ chủ sở hữu Numina qua địa chỉ email hỗ trợ được công bố trên website để yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu.' : 'Contact the Numina owner through the support email published on the website to request access, correction, or deletion of your data.'}</p></section>
          </>
        ) : (
          <>
            <section><h2>{vi ? '1. Bản chất dịch vụ' : '1. Service nature'}</h2><p>{vi ? 'Numina là công cụ tự phản chiếu và giải trí dựa trên thần số học. Nội dung không phải chẩn đoán tâm lý, y tế, pháp lý, tài chính hay lời tiên đoán chắc chắn.' : 'Numina is a self-reflection and entertainment tool based on numerology. Its content is not psychological, medical, legal, financial advice, or a guaranteed prediction.'}</p></section>
            <section><h2>{vi ? '2. Tài khoản và sử dụng hợp lý' : '2. Accounts and fair use'}</h2><p>{vi ? 'Bạn chịu trách nhiệm bảo vệ tài khoản và không được lạm dụng API, tự động hóa gây tải, gửi nội dung bất hợp pháp hoặc cố vượt quota.' : 'You are responsible for protecting your account and must not abuse APIs, create harmful automated load, submit unlawful content, or bypass usage limits.'}</p></section>
            <section><h2>{vi ? '3. Gói Free và Pro' : '3. Free and Pro plans'}</h2><p>{vi ? 'Gói Free có quota giới hạn. Gói Pro cung cấp quota cao hơn và tính năng mở rộng. Quyền Pro chỉ được kích hoạt sau khi thanh toán được xác nhận bởi hệ thống thanh toán.' : 'The Free plan has limited quotas. Pro provides higher quotas and expanded features. Pro access is activated only after payment is confirmed by the payment system.'}</p></section>
            <section><h2>{vi ? '4. Thanh toán và hoàn tiền' : '4. Payments and refunds'}</h2><p>{vi ? 'Thanh toán được xử lý bởi đối tác thanh toán. Giá, chu kỳ, thuế và điều kiện hoàn tiền sẽ được hiển thị tại trang checkout trước khi xác nhận.' : 'Payments are processed by a payment partner. Price, billing cycle, taxes, and refund conditions will be shown at checkout before confirmation.'}</p></section>
            <section><h2>{vi ? '5. Thay đổi dịch vụ' : '5. Service changes'}</h2><p>{vi ? 'Numina có thể cập nhật, tạm dừng hoặc thay đổi tính năng để bảo đảm an toàn, chi phí và chất lượng vận hành.' : 'Numina may update, pause, or change features to maintain safety, cost control, and service quality.'}</p></section>
          </>
        )}
        <Link className="legal-back" href={vi ? '/pricing' : '/en/pricing'}>{vi ? 'Xem bảng giá →' : 'View pricing →'}</Link>
      </div>
    </main>
  );
}

