// StayOneDay 이메일 템플릿 시스템

export interface EmailTemplateProps {
  title: string
  content: string
  buttonText?: string
  buttonUrl?: string
  footerNote?: string
}

// StayOneDay 브랜드 컬러와 스타일
const BRAND_COLORS = {
  primary: '#0f172a', // 진한 네이비 (StayOneDay 메인 컬러)
  secondary: '#3b82f6', // 블루
  accent: '#f59e0b', // 앰버/골드
  success: '#10b981', // 그린
  warning: '#f59e0b', // 앰버
  danger: '#ef4444', // 레드
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b'
  }
}

// 기본 이메일 템플릿 구조
export function createEmailTemplate({
  title,
  content,
  buttonText,
  buttonUrl,
  footerNote
}: EmailTemplateProps): string {
  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${title} - StayOneDay</title>
      <style>
        /* Reset & Base Styles */
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif;
          line-height: 1.6;
          color: ${BRAND_COLORS.gray[700]};
          background-color: ${BRAND_COLORS.gray[50]};
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }

        table { border-collapse: collapse; width: 100%; }
        img { max-width: 100%; height: auto; display: block; }

        /* Container */
        .email-container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.1);
          overflow: hidden;
        }

        /* Header */
        .email-header {
          background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.gray[800]} 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          position: relative;
        }

        .email-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          opacity: 0.1;
        }

        .logo {
          font-size: 32px;
          font-weight: 900;
          letter-spacing: -1px;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }

        .logo-subtitle {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 400;
          position: relative;
          z-index: 1;
        }

        .email-title {
          font-size: 24px;
          font-weight: 700;
          margin-top: 20px;
          position: relative;
          z-index: 1;
        }

        /* Content */
        .email-content {
          padding: 40px 30px;
          background: white;
        }

        .content-section {
          margin-bottom: 30px;
        }

        .content-section h2 {
          color: ${BRAND_COLORS.primary};
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid ${BRAND_COLORS.gray[100]};
        }

        .content-section h3 {
          color: ${BRAND_COLORS.gray[800]};
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .content-section p {
          margin-bottom: 16px;
          color: ${BRAND_COLORS.gray[600]};
        }

        .content-section ul {
          margin-left: 20px;
          margin-bottom: 16px;
        }

        .content-section li {
          margin-bottom: 8px;
          color: ${BRAND_COLORS.gray[600]};
        }

        /* Info Card */
        .info-card {
          background: linear-gradient(135deg, ${BRAND_COLORS.gray[50]} 0%, white 100%);
          border: 1px solid ${BRAND_COLORS.gray[200]};
          border-left: 4px solid ${BRAND_COLORS.secondary};
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
        }

        .info-card h3 {
          color: ${BRAND_COLORS.secondary};
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding: 8px 0;
          border-bottom: 1px solid ${BRAND_COLORS.gray[100]};
        }

        .info-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .info-label {
          font-weight: 600;
          color: ${BRAND_COLORS.gray[700]};
        }

        .info-value {
          color: ${BRAND_COLORS.gray[600]};
        }

        .info-value code {
          background: ${BRAND_COLORS.gray[100]};
          padding: 4px 8px;
          border-radius: 4px;
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 14px;
          color: ${BRAND_COLORS.primary};
        }

        /* Warning Box */
        .warning-box {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
        }

        .warning-box h3 {
          color: #92400e;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .warning-box ul li {
          color: #92400e;
          margin-bottom: 8px;
        }

        .warning-box strong {
          color: #78350f;
        }

        /* Button */
        .email-button {
          display: inline-block;
          background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, #1e293b 100%);
          color: white !important;
          text-decoration: none !important;
          font-weight: 700;
          font-size: 16px;
          padding: 18px 40px;
          border-radius: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.4);
          margin: 24px 0;
          text-align: center;
          display: inline-block;
          border: 2px solid transparent;
        }

        .email-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(15, 23, 42, 0.6);
          background: linear-gradient(135deg, #334155 0%, ${BRAND_COLORS.primary} 100%);
        }

        .button-container {
          text-align: center;
          margin: 30px 0;
        }

        /* Contact Info */
        .contact-info {
          background: ${BRAND_COLORS.gray[50]};
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
        }

        .contact-info h3 {
          color: ${BRAND_COLORS.primary};
          margin-bottom: 16px;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          color: ${BRAND_COLORS.gray[600]};
        }

        .contact-item a {
          color: ${BRAND_COLORS.secondary};
          text-decoration: none;
        }

        .contact-item a:hover {
          text-decoration: underline;
        }

        /* Footer */
        .email-footer {
          background: ${BRAND_COLORS.primary};
          color: white;
          padding: 30px;
          text-align: center;
        }

        .footer-content {
          opacity: 0.9;
        }

        .footer-logo {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .footer-text {
          font-size: 14px;
          margin-bottom: 4px;
          opacity: 0.8;
        }

        .footer-note {
          font-size: 12px;
          opacity: 0.6;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        /* Responsive */
        @media only screen and (max-width: 600px) {
          .email-container {
            margin: 20px auto;
            border-radius: 0;
          }

          .email-header, .email-content, .email-footer {
            padding: 30px 20px;
          }

          .logo {
            font-size: 28px;
          }

          .email-title {
            font-size: 20px;
          }

          .info-card {
            padding: 20px;
          }

          .email-button {
            padding: 14px 24px;
            width: 100%;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .email-container {
            background: #1e293b !important;
          }

          .email-content {
            background: #1e293b !important;
          }

          .content-section h2 {
            color: #e2e8f0 !important;
          }

          .content-section p, .content-section li {
            color: #cbd5e1 !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="email-header">
          <div class="logo">StayOneDay</div>
          <div class="logo-subtitle">온전한 쉼, 완벽한 하루</div>
          <h1 class="email-title">${title}</h1>
        </div>

        <!-- Content -->
        <div class="email-content">
          ${content}

          ${buttonText && buttonUrl ? `
          <div class="button-container">
            <a href="${buttonUrl}" class="email-button">${buttonText}</a>
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div class="email-footer">
          <div class="footer-content">
            <div class="footer-logo">StayOneDay</div>
            <div class="footer-text">© 2024 StayOneDay by 누크랩스. All rights reserved.</div>
            ${footerNote ? `<div class="footer-note">${footerNote}</div>` : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// 사이트 URL 가져오기 (환경별 대응)
function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://stayoneday.co.kr'
}

// 인플루언서 환영 이메일 템플릿
export function createInfluencerWelcomeTemplate({
  name,
  email,
  temporaryPassword
}: {
  name: string
  email: string
  temporaryPassword: string
}): string {
  const siteUrl = getSiteUrl()
  const loginUrl = `${siteUrl}/influencer/login`
  const content = `
    <div class="content-section">
      <h2>계정 생성 완료</h2>
      <p>안녕하세요 <strong>${name}</strong>님, StayOneDay 인플루언서 파트너로 함께하게 되어 진심으로 환영합니다.</p>
      <p>관리팀에서 ${name}님의 계정을 생성해드렸습니다. 아래 정보로 로그인하신 후 활동을 시작해보세요.</p>
    </div>

    <div class="info-card">
      <h3>로그인 정보</h3>
      <div class="info-item">
        <span class="info-label">이메일</span>
        <span class="info-value">${email}</span>
      </div>
      <div class="info-item">
        <span class="info-label">임시 비밀번호</span>
        <span class="info-value"><code>${temporaryPassword}</code></span>
      </div>
      <div class="info-item">
        <span class="info-label">로그인 페이지</span>
        <span class="info-value"><a href="${loginUrl}">${siteUrl.replace('https://', '')}/influencer/login</a></span>
      </div>
    </div>

    <div class="warning-box">
      <h3>보안 안내</h3>
      <ul>
        <li><strong>첫 로그인 시 비밀번호 변경이 필수입니다.</strong></li>
        <li>임시 비밀번호는 보안을 위해 메모 후 이 이메일을 삭제해주세요.</li>
        <li>계정 관련 문의사항은 언제든 연락해주세요.</li>
      </ul>
    </div>

    <div class="contact-info">
      <h3>문의 및 지원</h3>
      <div class="contact-item">
        <span>이메일: <a href="mailto:info@nuklabs.com">info@nuklabs.com</a></span>
      </div>
      <div class="contact-item">
        <span>전화: 070-1234-5678</span>
      </div>
      <div class="contact-item">
        <span>웹사이트: <a href="${siteUrl}">${siteUrl.replace('https://', '')}</a></span>
      </div>
    </div>
  `

  return createEmailTemplate({
    title: '인플루언서 계정이 생성되었습니다',
    content,
    buttonText: '지금 로그인하기',
    buttonUrl: loginUrl,
    footerNote: '이 이메일은 인플루언서 계정 생성 알림을 위해 발송되었습니다.'
  })
}

// 비밀번호 재설정 이메일 템플릿
export function createPasswordResetTemplate({
  name,
  resetLink,
  userType = 'user'
}: {
  name: string
  resetLink: string
  userType?: 'admin' | 'host' | 'influencer' | 'user'
}): string {
  const userTypeKorean = {
    admin: '관리자',
    host: '호스트',
    influencer: '인플루언서',
    user: '사용자'
  }[userType]

  const content = `
    <div class="content-section">
      <h2>비밀번호 재설정 요청</h2>
      <p>안녕하세요 <strong>${name}</strong>님</p>
      <p>StayOneDay ${userTypeKorean} 계정의 비밀번호 재설정 요청을 받았습니다.</p>
      <p>아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.</p>
    </div>

    <div class="warning-box">
      <h3>보안 안내</h3>
      <ul>
        <li>이 링크는 <strong>24시간 후 만료</strong>됩니다.</li>
        <li>비밀번호 재설정을 요청하지 않았다면 이 이메일을 무시하세요.</li>
        <li>링크를 클릭할 수 없다면 아래 URL을 복사해서 브라우저에 붙여넣으세요.</li>
      </ul>
      <div style="margin-top: 16px; padding: 12px; background: rgba(255,255,255,0.7); border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px; color: #92400e;">
        ${resetLink}
      </div>
    </div>

    <div class="contact-info">
      <h3>도움이 필요하신가요?</h3>
      <p>문의사항이 있으시면 언제든 연락해주세요.</p>
      <div class="contact-item">
        <span>이메일: <a href="mailto:info@nuklabs.com">info@nuklabs.com</a></span>
      </div>
      <div class="contact-item">
        <span>전화: 070-1234-5678</span>
      </div>
    </div>
  `

  return createEmailTemplate({
    title: '비밀번호 재설정 요청',
    content,
    buttonText: '비밀번호 재설정하기',
    buttonUrl: resetLink,
    footerNote: '이 이메일은 비밀번호 재설정 요청을 위해 발송되었습니다.'
  })
}