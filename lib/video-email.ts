/**
 * 비디오 완료 알림 이메일 발송 시스템
 * Resend를 통한 트랜잭션 메일 (첨부 없이 링크만)
 */

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface VideoReadyEmailRequest {
  toEmail: string
  hostName: string
  videoUrl: string // 서명된 다운로드 URL
  dashboardUrl: string // 대시보드 URL
  accommodationName: string
  templateName?: string
  duration?: number // 초단위
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  details?: any
}

/**
 * 비디오 완료 알림 이메일 발송
 */
export async function sendVideoReadyEmail(request: VideoReadyEmailRequest): Promise<EmailResult> {
  const {
    toEmail,
    hostName,
    videoUrl,
    dashboardUrl,
    accommodationName,
    templateName = '영상',
    duration = 30
  } = request

  try {
    console.log(`[EMAIL] 비디오 완료 알림 발송: ${toEmail}`)

    const emailContent = generateVideoReadyHtml({
      hostName,
      accommodationName,
      templateName,
      videoUrl,
      dashboardUrl,
      duration
    })

    const { data, error } = await resend.emails.send({
      from: 'Stay OneDay <no-reply@stayoneday.co.kr>',
      to: [toEmail],
      subject: `[Stay OneDay] ${accommodationName} 영상이 완성되었습니다 🎬`,
      html: emailContent,
      headers: {
        'X-Entity-Ref-ID': `video-${Date.now()}`, // 추적용 ID
      },
      tags: [
        {
          name: 'category',
          value: 'video-ready'
        },
        {
          name: 'accommodation',
          value: accommodationName
        }
      ]
    })

    if (error) {
      console.error('[EMAIL] 발송 실패:', error)
      return {
        success: false,
        error: `이메일 발송 실패: ${error.message}`,
        details: error
      }
    }

    console.log(`[EMAIL] 발송 완료: ${data.id}`)

    return {
      success: true,
      messageId: data.id
    }

  } catch (error) {
    console.error('[EMAIL] 발송 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      details: error
    }
  }
}

/**
 * 비디오 완료 이메일 HTML 템플릿 생성
 */
function generateVideoReadyHtml(params: {
  hostName: string
  accommodationName: string
  templateName: string
  videoUrl: string
  dashboardUrl: string
  duration: number
}): string {
  const { hostName, accommodationName, templateName, videoUrl, dashboardUrl, duration } = params

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>영상이 완성되었습니다</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f8fafc;
      line-height: 1.6;
      color: #334155;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }

    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: 700;
    }

    .header p {
      margin: 0;
      font-size: 16px;
      opacity: 0.9;
    }

    .content {
      padding: 40px 30px;
    }

    .video-info {
      background-color: #f1f5f9;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      border-left: 4px solid #667eea;
    }

    .video-info h3 {
      margin: 0 0 12px 0;
      color: #1e293b;
      font-size: 18px;
    }

    .video-details {
      display: flex;
      justify-content: space-between;
      margin: 16px 0;
      font-size: 14px;
      color: #64748b;
    }

    .button-container {
      text-align: center;
      margin: 32px 0;
    }

    .primary-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 8px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s;
    }

    .secondary-button {
      display: inline-block;
      background-color: #e2e8f0;
      color: #475569;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      font-size: 14px;
      margin: 8px;
    }

    .warning-box {
      background-color: #fef3cd;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
    }

    .warning-box p {
      margin: 0;
      font-size: 14px;
      color: #92400e;
    }

    .footer {
      background-color: #f8fafc;
      padding: 24px 30px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }

    .footer a {
      color: #667eea;
      text-decoration: none;
    }

    @media (max-width: 600px) {
      .container {
        margin: 0 10px;
      }

      .header, .content {
        padding: 20px;
      }

      .video-details {
        flex-direction: column;
        gap: 8px;
      }

      .primary-button, .secondary-button {
        display: block;
        margin: 8px 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 헤더 -->
    <div class="header">
      <h1>🎬 영상이 완성되었습니다!</h1>
      <p>안녕하세요, ${hostName}님</p>
    </div>

    <!-- 콘텐츠 -->
    <div class="content">
      <p>요청하신 <strong>${accommodationName}</strong> 영상이 성공적으로 생성되었습니다.</p>

      <!-- 영상 정보 -->
      <div class="video-info">
        <h3>📹 영상 정보</h3>
        <div class="video-details">
          <span><strong>숙소:</strong> ${accommodationName}</span>
          <span><strong>템플릿:</strong> ${templateName}</span>
        </div>
        <div class="video-details">
          <span><strong>길이:</strong> ${duration}초</span>
          <span><strong>해상도:</strong> 1080×1920 (세로형)</span>
        </div>
      </div>

      <!-- 액션 버튼 -->
      <div class="button-container">
        <a href="${dashboardUrl}" class="primary-button">
          대시보드에서 보기
        </a>
        <a href="${videoUrl}" class="secondary-button">
          직접 다운로드
        </a>
      </div>

      <!-- 만료 경고 -->
      <div class="warning-box">
        <p>
          ⚠️ <strong>중요:</strong> 다운로드 링크는 <strong>72시간 후 만료</strong>됩니다.
          만료 후에도 대시보드에서 재발급 받을 수 있습니다.
        </p>
      </div>

      <!-- 추가 안내 -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
        <h4 style="color: #1e293b;">📝 이용 안내</h4>
        <ul style="color: #64748b; font-size: 14px;">
          <li>생성된 영상은 소셜 미디어, 홍보 자료 등에 자유롭게 활용하세요</li>
          <li>파일은 MP4 형식이며, 모바일과 PC에서 모두 재생 가능합니다</li>
          <li>추가 영상이 필요하시면 대시보드에서 새로 요청할 수 있습니다</li>
        </ul>
      </div>

      <p style="margin-top: 32px;">
        영상 제작에 문제가 있거나 궁금한 점이 있으시면 언제든 연락해 주세요.
        <br>
        감사합니다! 🙏
      </p>
    </div>

    <!-- 푸터 -->
    <div class="footer">
      <p>
        이 메일은 Stay OneDay 영상 제작 서비스에서 자동으로 발송되었습니다.
        <br>
        <a href="https://stayoneday.co.kr">Stay OneDay</a> |
        <a href="mailto:support@stayoneday.co.kr">고객지원</a>
      </p>
      <p style="margin-top: 12px; font-size: 11px; color: #94a3b8;">
        📧 Generated with Claude Code AI Video Studio
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * 영상 생성 실패 알림 이메일
 */
export async function sendVideoFailedEmail(request: {
  toEmail: string
  hostName: string
  accommodationName: string
  errorMessage: string
  retryUrl: string
}): Promise<EmailResult> {
  try {
    console.log(`[EMAIL] 영상 실패 알림 발송: ${request.toEmail}`)

    const { data, error } = await resend.emails.send({
      from: 'Stay OneDay <no-reply@stayoneday.co.kr>',
      to: [request.toEmail],
      subject: `[Stay OneDay] ${request.accommodationName} 영상 생성 중 문제가 발생했습니다`,
      html: generateVideoFailedHtml(request),
      tags: [
        {
          name: 'category',
          value: 'video-failed'
        }
      ]
    })

    if (error) {
      return {
        success: false,
        error: `실패 알림 발송 실패: ${error.message}`,
        details: error
      }
    }

    return {
      success: true,
      messageId: data.id
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      details: error
    }
  }
}

/**
 * 영상 실패 이메일 HTML 템플릿
 */
function generateVideoFailedHtml(params: {
  hostName: string
  accommodationName: string
  errorMessage: string
  retryUrl: string
}): string {
  const { hostName, accommodationName, errorMessage, retryUrl } = params

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>영상 생성 중 문제 발생</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #ef4444;
      color: white;
      padding: 30px;
      text-align: center;
    }
    .content {
      padding: 30px;
    }
    .error-box {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 16px;
      margin: 20px 0;
    }
    .retry-button {
      display: inline-block;
      background-color: #3b82f6;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ 영상 생성 중 문제가 발생했습니다</h1>
      <p>안녕하세요, ${hostName}님</p>
    </div>

    <div class="content">
      <p>죄송합니다. <strong>${accommodationName}</strong> 영상 생성 중 문제가 발생했습니다.</p>

      <div class="error-box">
        <p><strong>오류 내용:</strong> ${errorMessage}</p>
      </div>

      <p>다시 시도하시거나, 문제가 계속되면 고객지원팀에 문의해 주세요.</p>

      <div style="text-align: center;">
        <a href="${retryUrl}" class="retry-button">다시 시도하기</a>
      </div>
    </div>

    <div class="footer">
      <p>Stay OneDay 고객지원팀 | support@stayoneday.co.kr</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * 이메일 발송 상태 확인 (웹훅용)
 */
export async function handleEmailWebhook(payload: any): Promise<void> {
  try {
    console.log('[EMAIL] 웹훅 수신:', payload)

    // Resend 웹훅 이벤트 처리
    const { type, data } = payload

    switch (type) {
      case 'email.sent':
        console.log(`[EMAIL] 발송 완료: ${data.email_id}`)
        break

      case 'email.delivered':
        console.log(`[EMAIL] 배달 완료: ${data.email_id}`)
        break

      case 'email.bounced':
        console.warn(`[EMAIL] 반송됨: ${data.email_id}`, data.bounce_reason)
        break

      case 'email.complained':
        console.warn(`[EMAIL] 스팸 신고: ${data.email_id}`)
        break

      default:
        console.log(`[EMAIL] 알 수 없는 이벤트: ${type}`)
    }

  } catch (error) {
    console.error('[EMAIL] 웹훅 처리 오류:', error)
  }
}