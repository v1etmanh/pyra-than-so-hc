import Link from 'next/link';

export type LegalKind = 'privacy' | 'terms' | 'deletion';

type LegalPageProps = { locale: string; kind: LegalKind };

export function LegalPage({ locale, kind }: LegalPageProps) {
  const vi = locale === 'vi';
  const isPrivacy = kind === 'privacy';
  const isTerms = kind === 'terms';
  const isDeletion = kind === 'deletion';

  const homeHref = vi ? '/' : '/en/';
  const privacyHref = vi ? '/privacy' : '/en/privacy';
  const termsHref = vi ? '/terms' : '/en/terms';
  const deletionHref = vi ? '/data-deletion' : '/en/data-deletion';
  const pricingHref = vi ? '/pricing' : '/en/pricing';

  const getKicker = () => {
    if (isPrivacy) return 'NUMELYRA / PRIVACY';
    if (isTerms) return 'NUMELYRA / TERMS';
    return 'NUMELYRA / DATA DELETION';
  };

  const getTitle = () => {
    if (isPrivacy) return vi ? 'Chính sách quyền riêng tư' : 'Privacy Policy';
    if (isTerms) return vi ? 'Điều khoản sử dụng' : 'Terms of Service';
    return vi ? 'Hướng dẫn xóa dữ liệu người dùng' : 'User Data Deletion Instructions';
  };

  return (
    <main className="legal-page">
      <div className="legal-page-inner">
        <Link className="legal-back" href={homeHref}>← NUMELYRA</Link>
        <p className="batch-kicker">{getKicker()}</p>
        <h1>{getTitle()}</h1>
        <p className="legal-updated">
          {vi ? 'Cập nhật lần cuối: 22/10/2026 — Áp dụng cho numelyra.online' : 'Last updated: October 22, 2026 — Applicable to numelyra.online'}
        </p>

        {isPrivacy && (
          <>
            <section>
              <h2>{vi ? '1. Giới thiệu & Phạm vi áp dụng' : '1. Introduction & Scope'}</h2>
              <p>
                {vi
                  ? 'NUMELYRA (gọi tắt là "chúng tôi", vận hành tại website chính thức https://numelyra.online) cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của người dùng. Chính sách này giải thích minh bạch cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu khi bạn truy cập website hoặc sử dụng các tính năng Thần số học, bốc bài Tarot AI, tạo hình nền may mắn và các dịch vụ liên quan.'
                  : 'NUMELYRA ("we", operating at the official website https://numelyra.online) is committed to protecting your privacy and personal data. This policy transparently explains how we collect, use, store, and safeguard your information when you visit our website or use our Pythagorean numerology, AI Tarot readings, lucky wallpaper generator, and related services.'}
              </p>
            </section>

            <section>
              <h2>{vi ? '2. Dữ liệu chúng tôi thu thập' : '2. Data We Collect'}</h2>
              <p>
                {vi
                  ? 'Chúng tôi chỉ thu thập những dữ liệu cần thiết để cung cấp tính năng và trải nghiệm cá nhân hóa tốt nhất cho bạn:'
                  : 'We only collect data strictly necessary to provide features and deliver your personalized experience:'}
              </p>
              <ul>
                <li>
                  <strong>{vi ? 'Thông tin đăng nhập tài khoản (Facebook / Google Login): ' : 'Account Login Information (Facebook / Google Login): '}</strong>
                  {vi
                    ? 'Khi bạn chọn đăng nhập bằng Facebook hoặc Google, chúng tôi nhận các thông tin công khai được bạn cấp phép từ nhà cung cấp danh tính, bao gồm: Họ tên hiển thị, Địa chỉ Email, Ảnh đại diện (avatar) và Mã định danh người dùng (User ID). Chúng tôi KHÔNG có quyền truy cập mật khẩu tài khoản mạng xã hội hay danh sách bạn bè của bạn.'
                    : 'When you choose to log in via Facebook or Google, we receive authorized public profile information from the identity provider, including: Display Name, Email Address, Profile Picture (avatar), and User ID. We NEVER have access to your social account password or friend list.'}
                </li>
                <li>
                  <strong>{vi ? 'Dữ liệu Thần số học & Chiêm tinh: ' : 'Numerology & Astrological Data: '}</strong>
                  {vi
                    ? 'Họ tên khai sinh, ngày tháng năm sinh, giờ sinh (nếu có), giới tính và các câu hỏi, phản hồi bạn chủ động nhập khi tạo hồ sơ hoặc tra cứu chỉ số.'
                    : 'Birth name, date of birth, time of birth (optional), gender, and questions/prompts you actively provide when creating a profile or calculating indicators.'}
                </li>
                <li>
                  <strong>{vi ? 'Dữ liệu kỹ thuật & Phiên làm việc: ' : 'Technical & Session Data: '}</strong>
                  {vi
                    ? 'Địa chỉ IP (được ẩn danh hóa theo tiêu chuẩn), loại trình duyệt, loại thiết bị và cookie kỹ thuật thiết yếu để duy trì trạng thái đăng nhập an toàn.'
                    : 'Anonymized IP addresses, browser types, device information, and essential technical cookies required to maintain secure user sessions.'}
                </li>
              </ul>
            </section>

            <section>
              <h2>{vi ? '3. Mục đích sử dụng dữ liệu' : '3. How Data Is Used'}</h2>
              <p>
                {vi
                  ? 'Dữ liệu thu thập được sử dụng cho các mục đích chính đáng sau:'
                  : 'Collected data is strictly used for the following legitimate purposes:'}
              </p>
              <ul>
                <li>{vi ? 'Xác thực danh tính, tạo và quản lý tài khoản thành viên an toàn.' : 'Authenticating your identity, creating and managing your account securely.'}</li>
                <li>{vi ? 'Tính toán chính xác bản đồ 24 chỉ số Thần số học Pythagoras và các chu kỳ vận số.' : 'Accurately computing your full 24 Pythagorean numerology indicators and life cycle charts.'}</li>
                <li>{vi ? 'Tạo luận giải Tarot AI và chiêm tinh học cá nhân hóa theo ngữ cảnh câu hỏi của bạn.' : 'Generating personalized AI Tarot readings and astrological insights based on your queries.'}</li>
                <li>{vi ? 'Đồng bộ hóa hồ sơ đã lưu giữa các thiết bị khi bạn đăng nhập.' : 'Syncing saved profiles and readings across your devices when signed in.'}</li>
                <li>{vi ? 'Cung cấp hỗ trợ kỹ thuật, chăm sóc khách hàng và giải đáp thắc mắc.' : 'Providing customer support, technical assistance, and responding to inquiries.'}</li>
              </ul>
              <p>
                <strong>{vi ? 'CAM KẾT: ' : 'OUR PLEDGE: '}</strong>
                {vi
                  ? 'NUMELYRA KHÔNG bán, KHÔNG cho thuê và KHÔNG thương mại hóa thông tin cá nhân của người dùng cho bất kỳ bên thứ ba hoặc nhà quảng cáo nào.'
                  : 'NUMELYRA DOES NOT sell, rent, or trade your personal data to any third party or advertiser under any circumstances.'}
              </p>
            </section>

            <section>
              <h2>{vi ? '4. Lưu trữ, Bảo mật & Bên thứ ba' : '4. Storage, Security & Third Parties'}</h2>
              <p>
                {vi
                  ? 'Chúng tôi áp dụng các tiêu chuẩn kỹ thuật nghiêm ngặt để bảo vệ dữ liệu của bạn:'
                  : 'We apply strict technical standards to safeguard your personal information:'}
              </p>
              <ul>
                <li>
                  <strong>{vi ? 'Cơ sở dữ liệu an toàn (Supabase): ' : 'Secure Database (Supabase): '}</strong>
                  {vi
                    ? 'Dữ liệu tài khoản và hồ sơ đồng bộ được lưu trữ tại trung tâm dữ liệu bảo mật cao của Supabase, với kết nối mã hóa SSL/TLS chuẩn ngân hàng.'
                    : 'Account data and synced profiles are stored within Supabase secure cloud infrastructure with end-to-end SSL/TLS encryption.'}
                </li>
                <li>
                  <strong>{vi ? 'Chế độ khách (Chưa đăng nhập): ' : 'Guest Mode (Unauthenticated): '}</strong>
                  {vi
                    ? 'Nếu bạn chưa đăng nhập, hồ sơ và kết quả tra cứu chỉ được lưu trong bộ nhớ cục bộ (Local Storage / IndexedDB) trên thiết bị của bạn.'
                    : 'If you are not signed in, profiles and calculations remain strictly stored in local storage on your own device.'}
                </li>
                <li>
                  <strong>{vi ? 'Phân tích ẩn danh: ' : 'Anonymous Analytics: '}</strong>
                  {vi
                    ? 'Nếu bạn đồng ý, hệ thống sử dụng Google Analytics với tính năng ẩn danh địa chỉ IP và tuyệt đối không gửi ngày sinh hay tên đầy đủ vào sự kiện phân tích.'
                    : 'With your consent, Google Analytics runs with IP anonymization enabled, never forwarding raw birth dates or full names in tracking events.'}
                </li>
                <li>
                  <strong>{vi ? 'Nhà cung cấp AI: ' : 'AI Model Providers: '}</strong>
                  {vi
                    ? 'Các câu hỏi bốc bài Tarot được xử lý qua API bảo mật mà không kèm theo bất kỳ thông tin nhận dạng cá nhân nhạy cảm nào.'
                    : 'Tarot queries are processed via secure APIs without attaching any personally identifiable sensitive data.'}
                </li>
              </ul>
            </section>

            <section id="data-deletion">
              <h2>{vi ? '5. Quyền của bạn & Hướng dẫn xóa dữ liệu (User Data Deletion)' : '5. Your Rights & User Data Deletion Instructions'}</h2>
              <p>
                {vi
                  ? 'Tuân thủ Điều khoản Nền tảng của Meta (Facebook Platform Policy) và các quy định về bảo vệ quyền riêng tư người dùng, bạn có toàn quyền quản lý, trích xuất hoặc xóa bỏ vĩnh viễn dữ liệu của mình bất cứ lúc nào qua các phương thức sau:'
                  : 'In compliance with Meta Platform Policies (Facebook Login) and global data protection regulations, you have full ownership and control over your data. You can request deletion anytime via the following methods:'}
              </p>
              <ol>
                <li>
                  <strong>{vi ? 'Cách 1: Xóa trực tiếp trong ứng dụng: ' : 'Method 1: Direct in-app deletion: '}</strong>
                  {vi
                    ? 'Đăng nhập vào tài khoản trên website -> Vào trang Tài khoản (/account) -> Nhấn "Xóa tài khoản & Dữ liệu". Hệ thống sẽ xóa toàn bộ hồ sơ, lịch sử tra cứu và tài khoản của bạn ngay lập tức.'
                    : 'Log in to your account -> Navigate to Account Settings (/account) -> Click "Delete Account & Data". All profiles, readings, and account records will be permanently removed immediately.'}
                </li>
                <li>
                  <strong>{vi ? 'Cách 2: Gỡ quyền ứng dụng NUMELYRA trên Facebook: ' : 'Method 2: Remove NUMELYRA permissions on Facebook: '}</strong>
                  {vi
                    ? 'Truy cập tài khoản Facebook của bạn -> Cài đặt & Quyền riêng tư -> Cài đặt -> Ứng dụng và trang web (Apps and Websites) -> Tìm ứng dụng "NUMELYRA" -> Nhấn nút "Gỡ" (Remove). Facebook sẽ ngừng chia sẻ thông tin với NUMELYRA.'
                    : 'Go to your Facebook Profile -> Settings & Privacy -> Settings -> Apps and Websites -> Locate "NUMELYRA" -> Click "Remove". Facebook will immediately revoke access and notify our systems.'}
                </li>
                <li>
                  <strong>{vi ? 'Cách 3: Gửi yêu cầu xóa dữ liệu qua Email: ' : 'Method 3: Submit a deletion request via Email: '}</strong>
                  {vi
                    ? 'Gửi email trực tiếp đến địa chỉ mqnyle@gmail.com với tiêu đề "[NUMELYRA] Yêu cầu xóa dữ liệu người dùng" kèm theo địa chỉ email tài khoản của bạn. Đội ngũ kỹ thuật sẽ xác nhận và hoàn tất xóa dữ liệu trong vòng 24 - 48 giờ làm việc.'
                    : 'Send an email to mqnyle@gmail.com with subject "[NUMELYRA] User Data Deletion Request" specifying your registered account email. Our technical team will process and confirm permanent deletion within 24 to 48 business hours.'}
                </li>
              </ol>
            </section>

            <section>
              <h2>{vi ? '6. Thông tin liên hệ' : '6. Contact Information'}</h2>
              <p>
                {vi
                  ? 'Nếu bạn có bất kỳ câu hỏi, góp ý hoặc yêu cầu nào liên quan đến Chính sách quyền riêng tư này, vui lòng liên hệ với chúng tôi qua:'
                  : 'If you have any questions, suggestions, or requests regarding this Privacy Policy, please contact us at:'}
              </p>
              <ul>
                <li><strong>{vi ? 'Tên dịch vụ: ' : 'Service Name: '}</strong>NUMELYRA</li>
                <li><strong>{vi ? 'Tên miền chính thức: ' : 'Official Website: '}</strong><a href="https://numelyra.online">https://numelyra.online</a></li>
                <li><strong>{vi ? 'Email hỗ trợ & Bảo mật: ' : 'Support & Privacy Email: '}</strong><a href="mailto:mqnyle@gmail.com">mqnyle@gmail.com</a></li>
              </ul>
            </section>
          </>
        )}

        {isTerms && (
          <>
            <section>
              <h2>{vi ? '1. Bản chất dịch vụ' : '1. Service Nature'}</h2>
              <p>
                {vi
                  ? 'NUMELYRA là nền tảng khám phá bản thân, chiêm nghiệm và giải trí dựa trên hệ thống Thần số học Pythagoras và biểu tượng Tarot. Các nội dung, chỉ số và phân tích do hệ thống cung cấp mang tính chất định hướng, tham khảo và tự phản chiếu cá nhân; không phải chẩn đoán tâm lý, y tế, pháp lý, tài chính hay lời tiên đoán chắc chắn cho tương lai.'
                  : 'NUMELYRA is a self-reflection, mindfulness, and entertainment platform based on Pythagorean numerology and Tarot symbolism. All interpretations and calculated indicators are provided for personal insight, contemplation, and self-discovery; they do not constitute medical, psychological, legal, or financial advice, nor guaranteed future predictions.'}
              </p>
            </section>

            <section>
              <h2>{vi ? '2. Tài khoản và sử dụng hợp lý' : '2. Accounts and Fair Use'}</h2>
              <p>
                {vi
                  ? 'Bạn có trách nhiệm bảo vệ thông tin đăng nhập tài khoản của mình. Người dùng không được phép lạm dụng API, phát tán mã độc, sử dụng công cụ tự động hóa trái phép gây quá tải hệ thống, hoặc gửi nội dung vi phạm pháp luật.'
                  : 'You are responsible for safeguarding your login credentials. Users must not abuse APIs, distribute malicious scripts, utilize automated scrapers causing system overload, or submit unlawful content.'}
              </p>
            </section>

            <section>
              <h2>{vi ? '3. Gói dịch vụ Miễn phí & Pro' : '3. Free and Pro Plans'}</h2>
              <p>
                {vi
                  ? 'NUMELYRA cung cấp các tính năng miễn phí với giới hạn lượt tra cứu mỗi ngày. Gói Pro cung cấp quyền truy cập mở rộng, phân tích chuyên sâu và không giới hạn tra cứu. Quyền lợi Pro được kích hoạt sau khi giao dịch thanh toán được xác nhận hợp lệ.'
                  : 'NUMELYRA offers core features free of charge subject to reasonable usage quotas. Pro subscriptions grant higher limits, in-depth reports, and advanced features. Pro privileges activate upon verified payment confirmation.'}
              </p>
            </section>

            <section>
              <h2>{vi ? '4. Thanh toán & Hoàn tiền' : '4. Payments & Refunds'}</h2>
              <p>
                {vi
                  ? 'Thanh toán được xử lý bảo mật qua các cổng thanh toán đối tác được tích hợp. Chi tiết giá, chu kỳ thanh toán và chính sách hoàn tiền được công bố minh bạch tại trang thanh toán trước khi bạn xác nhận giao dịch.'
                  : 'Payments are securely processed through integrated payment gateways. Pricing details, billing cycles, and refund terms are clearly displayed at checkout prior to order confirmation.'}
              </p>
            </section>

            <section>
              <h2>{vi ? '5. Điều chỉnh điều khoản' : '5. Amendments to Terms'}</h2>
              <p>
                {vi
                  ? 'Chúng tôi có quyền cập nhật các điều khoản này theo thời gian nhằm đáp ứng yêu cầu kỹ thuật, vận hành hoặc pháp lý. Mọi thay đổi lớn sẽ được thông báo trên website https://numelyra.online.'
                  : 'We reserve the right to amend these Terms from time to time to reflect operational, legal, or technical changes. Substantial updates will be posted on https://numelyra.online.'}
              </p>
            </section>

            <section>
              <h2>{vi ? '6. Thông tin liên hệ' : '6. Contact Us'}</h2>
              <p>
                {vi
                  ? 'Mọi câu hỏi về Điều khoản sử dụng vui lòng gửi về email: mqnyle@gmail.com.'
                  : 'Questions regarding these Terms of Service may be addressed to: mqnyle@gmail.com.'}
              </p>
            </section>
          </>
        )}

        {isDeletion && (
          <>
            <section>
              <h2>{vi ? 'Chính sách & Hướng dẫn xóa dữ liệu người dùng' : 'User Data Deletion Instructions'}</h2>
              <p>
                {vi
                  ? 'Theo Quy định nền tảng của Meta (Facebook Login) và các tiêu chuẩn bảo vệ quyền riêng tư toàn cầu, người dùng có quyền yêu cầu xóa toàn bộ thông tin cá nhân và dữ liệu được tạo ra trong quá trình sử dụng NUMELYRA (https://numelyra.online).'
                  : 'Pursuant to Meta Platform Terms (Facebook Login) and global data protection standards, users have the absolute right to request permanent deletion of their personal information and data generated on NUMELYRA (https://numelyra.online).'}
              </p>
            </section>

            <section>
              <h2>{vi ? 'Các phương thức thực hiện xóa dữ liệu' : 'How to Delete Your Data'}</h2>
              <ol>
                <li>
                  <strong>{vi ? 'Cách 1: Xóa tài khoản trực tiếp trên website (Khuyên dùng)' : 'Method 1: Direct In-App Deletion (Recommended)'}</strong>
                  <p>
                    {vi
                      ? '1. Đăng nhập vào tài khoản NUMELYRA của bạn tại https://numelyra.online.'
                      : '1. Log in to your NUMELYRA account at https://numelyra.online.'}
                    <br />
                    {vi
                      ? '2. Truy cập trang Quản lý tài khoản tại liên kết /account.'
                      : '2. Go to the Account Management page at /account.'}
                    <br />
                    {vi
                      ? '3. Chọn mục "Xóa tài khoản và dữ liệu" và xác nhận. Toàn bộ hồ sơ số học, trải bài Tarot và thông tin cá nhân sẽ được xóa vĩnh viễn khỏi máy chủ ngay lập tức.'
                      : '3. Select "Delete Account and Data" and confirm. All your numerology profiles, Tarot readings, and account data will be permanently wiped immediately.'}
                  </p>
                </li>
                <li>
                  <strong>{vi ? 'Cách 2: Gỡ ứng dụng NUMELYRA khỏi tài khoản Facebook' : 'Method 2: Remove the NUMELYRA App from Facebook'}</strong>
                  <p>
                    {vi
                      ? 'Nếu bạn đã đăng nhập qua Facebook và muốn hủy liên kết ứng dụng:'
                      : 'If you signed in via Facebook and want to unlink the application:'}
                    <br />
                    {vi
                      ? '1. Đăng nhập vào Facebook cá nhân của bạn.'
                      : '1. Log in to your personal Facebook account.'}
                    <br />
                    {vi
                      ? '2. Vào "Cài đặt & Quyền riêng tư" (Settings & Privacy) -> Chọn "Cài đặt" (Settings).'
                      : '2. Navigate to "Settings & Privacy" -> Click "Settings".'}
                    <br />
                    {vi
                      ? '3. Ở cột bên trái, cuộn xuống và chọn "Ứng dụng và trang web" (Apps and Websites).'
                      : '3. In the sidebar, scroll to "Apps and Websites".'}
                    <br />
                    {vi
                      ? '4. Tìm ứng dụng "NUMELYRA", sau đó bấm nút "Gỡ" (Remove).'
                      : '4. Locate "NUMELYRA" and click "Remove".'}
                    <br />
                    {vi
                      ? '5. (Tùy chọn): Tích chọn xóa bài đăng, video hoặc sự kiện mà ứng dụng đã từng đăng và xác nhận gỡ.'
                      : '5. (Optional): Check the box to remove all related activity and confirm removal.'}
                  </p>
                </li>
                <li>
                  <strong>{vi ? 'Cách 3: Gửi email yêu cầu hỗ trợ xóa dữ liệu thủ công' : 'Method 3: Submit an Email Data Deletion Request'}</strong>
                  <p>
                    {vi
                      ? 'Bạn có thể gửi yêu cầu trực tiếp đến Ban quản trị NUMELYRA:'
                      : 'You can submit a formal deletion request directly to NUMELYRA administration:'}
                    <br />
                    {vi ? '• Email tiếp nhận: ' : '• Email address: '}<strong><a href="mailto:mqnyle@gmail.com">mqnyle@gmail.com</a></strong>
                    <br />
                    {vi ? '• Tiêu đề thư: ' : '• Subject line: '}<code>[NUMELYRA] Yêu cầu xóa dữ liệu người dùng / Data Deletion Request</code>
                    <br />
                    {vi
                      ? '• Nội dung thư: Vui lòng cung cấp địa chỉ email tài khoản đã đăng ký trên NUMELYRA hoặc Facebook User ID.'
                      : '• Content: Please specify your registered email address or Facebook User ID.'}
                    <br />
                    {vi
                      ? '• Thời gian xử lý: Đội ngũ kỹ thuật sẽ xác nhận và hoàn tất xóa sạch dữ liệu trong vòng 24 - 48 giờ làm việc, đồng thời gửi email thông báo xác nhận cho bạn.'
                      : '• Processing timeline: Our technical team will process and complete data deletion within 24–48 business hours, sending you a final confirmation email.'}
                  </p>
                </li>
              </ol>
            </section>
          </>
        )}

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #e2ddd5', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <Link className="legal-back" href={privacyHref}>{vi ? 'Chính sách riêng tư (/privacy)' : 'Privacy Policy (/privacy)'}</Link>
          <Link className="legal-back" href={termsHref}>{vi ? 'Điều khoản sử dụng (/terms)' : 'Terms of Service (/terms)'}</Link>
          <Link className="legal-back" href={deletionHref}>{vi ? 'Hướng dẫn xóa dữ liệu (/data-deletion)' : 'Data Deletion (/data-deletion)'}</Link>
          <Link className="legal-back" href={pricingHref}>{vi ? 'Bảng giá Pro →' : 'Pro Pricing →'}</Link>
        </div>
      </div>
    </main>
  );
}
