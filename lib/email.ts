import nodemailer from 'nodemailer'
import { createInfluencerWelcomeTemplate, createPasswordResetTemplate } from './email-templates'

// SMTP 설정
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// 이메일 전송 함수
export async function sendEmail({
  to,
  subject,
  html,
  text
}: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  try {
    const info = await transporter.sendMail({
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      text: text || stripHtml(html),
      html,
    })

    console.log('✅ 이메일 발송 성공:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ 이메일 발송 실패:', error)
    return { success: false, error }
  }
}

// HTML에서 텍스트 추출 (간단한 버전)
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

// 인플루언서 계정 생성 알림 이메일
export async function sendInfluencerWelcomeEmail({
  name,
  email,
  temporaryPassword
}: {
  name: string
  email: string
  temporaryPassword: string
}) {
  const subject = `StayOneDay 인플루언서 계정이 생성되었습니다 - ${name}님`

  // 새로운 전문적인 이메일 템플릿 사용
  const html = createInfluencerWelcomeTemplate({
    name,
    email,
    temporaryPassword
  })

  return sendEmail({
    to: email,
    subject,
    html
  })
}

// 비밀번호 재설정 이메일
export async function sendPasswordResetEmail({
  name,
  email,
  resetLink,
  userType = 'user'
}: {
  name: string
  email: string
  resetLink: string
  userType?: 'admin' | 'host' | 'influencer' | 'user'
}) {
  const subject = `StayOneDay 비밀번호 재설정 요청`

  // 새로운 전문적인 이메일 템플릿 사용
  const html = createPasswordResetTemplate({
    name,
    resetLink,
    userType
  })

  return sendEmail({
    to: email,
    subject,
    html
  })
}

// 이메일 연결 테스트
export async function testEmailConnection() {
  try {
    await transporter.verify()
    console.log('✅ SMTP 연결 성공')
    return { success: true }
  } catch (error) {
    console.error('❌ SMTP 연결 실패:', error)
    return { success: false, error }
  }
}