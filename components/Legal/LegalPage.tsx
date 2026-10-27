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
          {vi ? 'Cập nhật lần cuối: 25/10/2026 — Áp dụng cho numelyra.online' : 'Last updated: October 25, 2026 — Applicable to numelyra.online'}
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
                    ? 'Gửi email trực tiếp đến địa chỉ mqnyle231@gmail.com với tiêu đề "[NUMELYRA] Yêu cầu xóa dữ liệu người dùng" kèm theo địa chỉ email tài khoản của bạn. Đội ngũ kỹ thuật sẽ xác nhận và hoàn tất xóa dữ liệu trong vòng 24 - 48 giờ làm việc.'
                    : 'Send an email to mqnyle231@gmail.com with subject "[NUMELYRA] User Data Deletion Request" specifying your registered account email. Our technical team will process and confirm permanent deletion within 24 to 48 business hours.'}
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
                <li><strong>{vi ? 'Email hỗ trợ & Bảo mật: ' : 'Support & Privacy Email: '}</strong><a href="mailto:mqnyle231@gmail.com">mqnyle231@gmail.com</a></li>
              </ul>
            </section>
          </>
        )}

        {isTerms && (
          <>
            <section>
              <h2>{vi ? '1. Giới thiệu và chấp nhận điều khoản' : '1. Introduction and Acceptance of Terms'}</h2>
              <p>
                {vi
                  ? 'Chào mừng bạn đến với NUMELYRA (bao gồm ứng dụng trò chuyện AI numelyra_chat, vận hành tại https://numelyra.online). Các Điều khoản dịch vụ này ("Điều khoản") cấu thành thỏa thuận pháp lý ràng buộc giữa bạn ("Người dùng") và NUMELYRA ("chúng tôi"). Bằng việc truy cập trang web, tạo tài khoản hoặc đăng nhập thông qua Email hay Facebook, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ toàn bộ các Điều khoản này cùng Chính sách quyền riêng tư của chúng tôi. Nếu bạn không đồng ý với bất kỳ phần nào, vui lòng ngưng sử dụng dịch vụ ngay lập tức.'
                  : 'Welcome to NUMELYRA (including the numelyra_chat conversational AI companion, accessible at https://numelyra.online). These Terms of Service ("Terms") constitute a legally binding agreement between you ("User" or "you") and NUMELYRA ("we", "us", or "our"). By accessing or using our website, creating an account, or logging in via Email or Facebook, you acknowledge that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, please discontinue use immediately.'}
              </p>
            </section>

            <section>
              <h2>{vi ? '2. Mô tả dịch vụ' : '2. Description of Service'}</h2>
              <p>
                {vi
                  ? 'NUMELYRA cung cấp nền tảng trải nghiệm tâm thức và khám phá bản thân hiện đại, nổi bật với tính năng numelyra_chat — bạn đồng hành đàm thoại trí tuệ nhân tạo (AI Companion), công cụ tính toán 24 chỉ số Thần số học Pythagoras, trải bài Tarot AI và biểu đồ năng lượng cá nhân hóa. Dịch vụ được phát triển nhằm mục đích chiêm nghiệm, giải trí, tìm kiếm cảm hứng sống và tự phản chiếu nội tâm.'
                  : 'NUMELYRA provides an intelligent spiritual discovery and personal reflection platform, centered around numelyra_chat — an AI companion for interactive conversations, classical Pythagorean numerology chart generation, AI-guided Tarot readings, and personalized mindfulness insights. The service is crafted solely for entertainment, self-reflection, mindfulness, and personal growth.'}
              </p>
            </section>

            <section>
              <h2>{vi ? '3. Tài khoản người dùng' : '3. User Accounts and Eligibility'}</h2>
              <p>
                {vi
                  ? 'Để sử dụng các tính năng nâng cao và lưu trữ hồ sơ, bạn cần đáp ứng các điều kiện sau:'
                  : 'To access enhanced features and save persistent profiles, you must satisfy the following conditions:'}
              </p>
              <ul>
                <li>
                  <strong>{vi ? 'Độ tuổi tối thiểu: ' : 'Minimum Age: '}</strong>
                  {vi
                    ? 'Bạn phải từ đủ 13 tuổi trở lên (hoặc từ đủ 16 tuổi nếu bạn cư trú tại Liên minh Châu Âu theo quy định GDPR) để đăng ký tài khoản hoặc sử dụng dịch vụ.'
                    : 'You must be at least 13 years old (or at least 16 years old if you reside in the European Union under GDPR requirements) to create an account or use NUMELYRA.'}
                </li>
                <li>
                  <strong>{vi ? 'Đăng nhập qua Facebook & Email: ' : 'Facebook Login & Email: '}</strong>
                  {vi
                    ? 'Bạn có thể đăng ký bằng Email hoặc thông qua Facebook Login. Khi đăng nhập bằng Facebook, bạn ủy quyền cho chúng tôi tiếp nhận các thông tin công khai (Tên, Email, Ảnh đại diện, User ID) tuân thủ đúng Điều khoản nền tảng của Meta.'
                    : 'You may authenticate via Email or third-party Facebook Login. By logging in via Facebook, you authorize us to receive permitted public profile data (Display Name, Email, Avatar, User ID) in strict accordance with Meta Platform Terms.'}
                </li>
                <li>
                  <strong>{vi ? 'Bảo mật tài khoản: ' : 'Account Security: '}</strong>
                  {vi
                    ? 'Bạn có trách nhiệm bảo mật thông tin đăng nhập của mình và chịu mọi trách nhiệm cho các hoạt động diễn ra dưới tài khoản của bạn. Nếu phát hiện hành vi xâm nhập trái phép, vui lòng thông báo ngay cho chúng tôi qua mqnyle231@gmail.com.'
                    : 'You are responsible for safeguarding your credentials and for all activities conducted under your account. Notify us immediately at mqnyle231@gmail.com if you suspect unauthorized access.'}
                </li>
              </ul>
            </section>

            <section>
              <h2>{vi ? '4. Quy tắc sử dụng và hành vi bị cấm' : '4. Acceptable Use and Prohibited Conduct'}</h2>
              <p>
                {vi
                  ? 'Khi sử dụng NUMELYRA và hệ thống numelyra_chat, bạn cam kết KHÔNG thực hiện các hành vi sau:'
                  : 'When utilizing NUMELYRA and the numelyra_chat companion, you agree NOT to engage in any of the following:'}
              </p>
              <ul>
                <li>
                  {vi
                    ? 'Gửi, truyền tải hoặc tạo các nội dung bất hợp pháp, xúc phạm danh dự, quấy rối, đe dọa, thù hận, khiêu dâm, bạo lực hoặc khuyến khích hành vi tự hại.'
                    : 'Transmit, post, or prompt content that is illegal, defamatory, harassing, abusive, threatening, hateful, sexually explicit, violent, or encouraging self-harm.'}
                </li>
                <li>
                  {vi
                    ? 'Lợi dụng lỗ hổng, đảo ngược mã nguồn, dịch ngược (reverse-engineer), tấn công từ chối dịch vụ (DoS/DDoS) hoặc cố tình phá hoại hạ tầng kỹ thuật và API.'
                    : 'Exploit security vulnerabilities, reverse-engineer, decompile, launch denial-of-service attacks, or tamper with system infrastructure and APIs.'}
                </li>
                <li>
                  {vi
                    ? 'Sử dụng bot, script tự động hoặc công cụ cào dữ liệu (scraper) trái phép làm quá tải hệ thống hoặc vượt qua giới hạn hạn ngạch (rate limits).'
                    : 'Deploy unauthorized bots, scrapers, or automated tools that degrade performance or circumvent platform rate limits.'}
                </li>
                <li>
                  {vi
                    ? 'Mạo danh cá nhân, tổ chức khác hoặc cung cấp thông tin lừa đảo, gây nhầm lẫn.'
                    : 'Impersonate another individual or entity, or provide deceptive or fraudulent information.'}
                </li>
              </ul>
            </section>

            <section>
              <h2>{vi ? '5. Miễn trừ trách nhiệm về nội dung do AI tạo ra' : '5. AI-Generated Content Disclaimer'}</h2>
              <p>
                {vi
                  ? 'Các phản hồi từ bạn đồng hành numelyra_chat và kết quả bốc bài Tarot được tạo tự động bởi các mô hình Trí tuệ Nhân tạo (AI). Xin lưu ý kỹ:'
                  : 'Responses generated by numelyra_chat and Tarot interpretations are created by automated Artificial Intelligence (AI) models. Please be advised:'}
              </p>
              <ul>
                <li>
                  <strong>{vi ? 'Tính chính xác: ' : 'Accuracy: '}</strong>
                  {vi
                    ? 'Nội dung AI có thể đôi khi không chính xác, thiếu sót hoặc có góc nhìn chủ quan. Bạn nên tiếp nhận với tinh thần tham khảo và chiêm nghiệm cá nhân.'
                    : 'AI-generated content may occasionally be inaccurate, incomplete, or biased. It should always be received as subjective creative interpretation.'}
                </li>
                <li>
                  <strong>{vi ? 'KHÔNG PHẢI LỜI KHUYÊN CHUYÊN GIA: ' : 'NOT PROFESSIONAL ADVICE: '}</strong>
                  {vi
                    ? 'Nội dung trên NUMELYRA KHÔNG PHẢI là chẩn đoán hoặc lời khuyên y tế, tâm thần, tâm lý, pháp lý, thuế hay đầu tư tài chính. Ứng dụng KHÔNG THỂ thay thế bác sĩ, chuyên gia tâm lý hay luật sư có bằng cấp chuyên môn.'
                    : 'Content provided by NUMELYRA DOES NOT constitute medical, psychiatric, psychological, legal, tax, or financial investment advice. It is NEVER a substitute for licensed healthcare or professional counsel.'}
                </li>
                <li>
                  <strong>{vi ? 'Không dùng cho tình huống khẩn cấp: ' : 'Emergency Situations: '}</strong>
                  {vi
                    ? 'Nếu bạn hoặc người thân đang trong tình trạng khủng hoảng tâm lý hoặc khẩn cấp về y tế, hãy liên hệ ngay với đường dây nóng y tế/cứu trợ địa phương hoặc bệnh viện gần nhất.'
                    : 'If you are experiencing emotional crisis or medical emergencies, please immediately contact your local emergency services, crisis hotline, or hospital.'}
                </li>
              </ul>
            </section>

            <section>
              <h2>{vi ? '6. Nội dung người dùng gửi lên và quyền sở hữu' : '6. User Content and Intellectual Property'}</h2>
              <p>
                {vi
                  ? 'Bạn giữ toàn quyền sở hữu đối với các câu hỏi, phản hồi và dữ liệu ngày sinh mà bạn nhập vào hệ thống. Bằng việc gửi nội dung, bạn cấp quyền cho NUMELYRA quyền sử dụng phi độc quyền, miễn phí bản quyền để xử lý và hiển thị dữ liệu phục vụ mục đích duy nhất là tạo phản hồi và lưu hồ sơ theo yêu cầu của bạn.'
                  : 'You retain ownership rights in the prompts, questions, and personal data you submit. By submitting inputs, you grant NUMELYRA a non-exclusive, royalty-free license to process and transmit such data solely as necessary to generate readings, deliver services, and maintain your account.'}
              </p>
              <p>
                {vi
                  ? 'Toàn bộ giao diện, thiết kế, thương hiệu, logo, mã nguồn, thuật toán và tài sản trí tuệ của NUMELYRA thuộc quyền sở hữu độc quyền của chúng tôi và được bảo hộ theo luật sở hữu trí tuệ.'
                  : 'All visual designs, user interfaces, branding, logos, proprietary code, algorithms, and content of NUMELYRA remain the exclusive intellectual property of NUMELYRA and its licensors.'}
              </p>
            </section>

            <section>
              <h2>{vi ? '7. Quyền riêng tư và bảo vệ dữ liệu' : '7. Privacy and Data Protection'}</h2>
              <p>
                {vi
                  ? 'Việc chúng tôi thu thập, sử dụng và bảo vệ dữ liệu cá nhân của bạn (bao gồm dữ liệu từ Facebook Login) được quy định chi tiết tại '
                  : 'Our collection, handling, and security of your personal data (including Facebook Login data) is governed by our '}
                <Link href={privacyHref}>
                  {vi ? 'Chính sách quyền riêng tư' : 'Privacy Policy'}
                </Link>
                {vi ? '. Bạn có thể tham khảo ' : '. You can also review our '}
                <Link href={deletionHref}>
                  {vi ? 'Hướng dẫn xóa dữ liệu người dùng' : 'User Data Deletion Instructions'}
                </Link>
                {vi
                  ? ' để biết các bước cụ thể gỡ quyền ứng dụng trên Facebook hoặc yêu cầu xóa dữ liệu hoàn toàn khỏi máy chủ.'
                  : ' for step-by-step guidance on revoking Facebook permissions or requesting permanent data deletion.'}
              </p>
            </section>

            <section>
              <h2>{vi ? '8. Thanh toán và gói dịch vụ' : '8. Subscriptions and Payments'}</h2>
              <p>
                {vi
                  ? 'NUMELYRA cung cấp các phép tính cục bộ không giới hạn và hạn mức AI miễn phí theo tháng. Người dùng có thể nâng cấp lên NUMELYRA Pro để nhận hạn mức tháng cao hơn; phiên bản hiện tại không bán xu hoặc lượt bổ sung.'
                  : 'NUMELYRA provides unlimited local calculations and a monthly free AI allowance. Users may upgrade to NUMELYRA Pro for higher monthly limits; the current version does not sell coins or quota add-ons.'}
              </p>
              <ul>
                <li>
                  {vi
                    ? 'Mọi giao dịch thanh toán được xử lý an toàn qua các đối tác cổng thanh toán được chứng nhận.'
                    : 'All transactions are securely processed through certified third-party payment gateways.'}
                </li>
                <li>
                  {vi
                    ? 'Giá niêm yết, chu kỳ thanh toán và điều kiện hủy gói được công khai minh bạch tại trang thanh toán trước khi bạn xác nhận giao dịch.'
                    : 'Pricing, renewal terms, and cancellation options are clearly displayed prior to final order confirmation.'}
                </li>
                <li>
                  {vi
                    ? 'Các khoản thanh toán cho dịch vụ kỹ thuật số đã kích hoạt sử dụng sẽ không được hoàn lại, trừ trường hợp pháp luật có quy định bắt buộc khác.'
                    : 'Digital service purchases are generally non-refundable once digital access has been granted, except as required by mandatory consumer protection laws.'}
                </li>
              </ul>
            </section>

            <section>
              <h2>{vi ? '9. Tạm ngưng hoặc chấm dứt tài khoản' : '9. Termination and Suspension'}</h2>
              <p>
                {vi
                  ? 'Bạn có thể tự do ngừng sử dụng dịch vụ và xóa tài khoản của mình bất kỳ lúc nào trong trang Cài đặt tài khoản hoặc bằng cách gửi yêu cầu cho chúng tôi.'
                  : 'You may cease using NUMELYRA and delete your account at any time via Account settings or by contacting our team.'}
              </p>
              <p>
                {vi
                  ? 'NUMELYRA có quyền tạm ngưng hoặc chấm dứt quyền truy cập của bạn ngay lập tức mà không cần báo trước nếu bạn vi phạm nghiêm trọng các Điều khoản này, thực hiện hành vi gian lận, phá hoại hoặc gây ảnh hưởng tiêu cực tới cộng đồng người dùng khác.'
                  : 'We reserve the right to suspend or terminate your access immediately, without prior notice, if you violate these Terms, engage in fraudulent activity, or jeopardize system security or other users.'}
              </p>
            </section>

            <section>
              <h2>{vi ? '10. Miễn trừ trách nhiệm và giới hạn trách nhiệm' : '10. Disclaimer of Warranties and Limitation of Liability'}</h2>
              <p>
                {vi
                  ? 'Dịch vụ được cung cấp trên nguyên tắc "NGUYÊN TRẠNG" (AS IS) và "SẴN CÓ" (AS AVAILABLE), không kèm theo bất kỳ tuyên bố bảo đảm ngầm định hay rõ ràng nào về tính chính xác tuyệt đối hoặc khả năng hoạt động không gián đoạn.'
                  : 'The service is provided on an "AS IS" and "AS AVAILABLE" basis, without warranties of any kind, whether express or implied, including merchantability, fitness for a particular purpose, or uninterrupted availability.'}
              </p>
              <p>
                {vi
                  ? 'Trong phạm vi tối đa được pháp luật cho phép, NUMELYRA và đội ngũ vận hành sẽ không chịu trách nhiệm đối với bất kỳ thiệt hại gián tiếp, ngẫu nhiên, hệ quả hoặc mất mát dữ liệu nào phát sinh từ việc bạn sử dụng hoặc không thể sử dụng dịch vụ.'
                  : 'To the fullest extent permitted by law, NUMELYRA and its team shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.'}
              </p>
            </section>

            <section>
              <h2>{vi ? '11. Thay đổi điều khoản' : '11. Changes to Terms'}</h2>
              <p>
                {vi
                  ? 'Chúng tôi có thể cập nhật các Điều khoản này theo thời gian để phản ánh những thay đổi trong sản phẩm hoặc yêu cầu pháp lý. Mọi thay đổi sẽ có hiệu lực ngay khi được đăng tải trên https://numelyra.online cùng ngày "Cập nhật lần cuối". Việc bạn tiếp tục sử dụng dịch vụ sau khi Điều khoản mới có hiệu lực đồng nghĩa với việc bạn đồng ý với các thay đổi đó.'
                  : 'We reserve the right to amend these Terms from time to time to accommodate product developments or legal updates. Revisions take effect immediately upon posting to https://numelyra.online with an updated "Last updated" date. Continued use of NUMELYRA constitutes your acceptance of the updated Terms.'}
              </p>
            </section>

            <section>
              <h2>{vi ? '12. Thông tin liên hệ' : '12. Contact Information'}</h2>
              <p>
                {vi
                  ? 'Nếu bạn có bất kỳ thắc mắc, phản hồi hoặc cần hỗ trợ về Điều khoản dịch vụ này, vui lòng liên hệ với chúng tôi qua:'
                  : 'If you have any questions, inquiries, or feedback regarding these Terms of Service, please contact us at:'}
              </p>
              <ul>
                <li><strong>{vi ? 'Tên dịch vụ: ' : 'Service Name: '}</strong>NUMELYRA (numelyra_chat)</li>
                <li><strong>{vi ? 'Website chính thức: ' : 'Official Website: '}</strong><a href="https://numelyra.online">https://numelyra.online</a></li>
                <li><strong>{vi ? 'Email tiếp nhận & Hỗ trợ: ' : 'Support & Legal Email: '}</strong><a href="mailto:mqnyle231@gmail.com">mqnyle231@gmail.com</a></li>
              </ul>
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
                    {vi ? '• Email tiếp nhận: ' : '• Email address: '}<strong><a href="mailto:mqnyle231@gmail.com">mqnyle231@gmail.com</a></strong>
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
