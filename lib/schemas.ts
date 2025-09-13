import { z } from 'zod'

// 공통 스키마
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
})

// 인플루언서 관련 스키마
export const InfluencerQuerySchema = PaginationSchema.extend({
  status: z.string().default('all'),
  category: z.string().default('all'),
  search: z.string().optional()
})

export const InfluencerCreateSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  phone: z.string().optional(),
  password: z.string().optional(),
  social_media_links: z.array(z.object({
    platform: z.string(),
    url: z.string().url()
  })).optional(),
  follower_count: z.number().default(0),
  engagement_rate: z.number().default(0),
  content_category: z.array(z.string()).default([]),
  collaboration_rate: z.number().default(0),
  preferred_collaboration_type: z.enum(['free', 'paid', 'product']).default('free'),
  bio: z.string().optional(),
  location: z.string().optional(),
  profile_image_url: z.string().url().optional()
})

// 호스트 관련 스키마
export const HostQuerySchema = PaginationSchema.extend({
  status: z.string().default('all'),
  search: z.string().optional()
})

export const HostCreateSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  phone: z.string().optional(),
  password: z.string().optional(),
  business_name: z.string().optional(),
  business_number: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['pending', 'active', 'inactive']).default('pending')
})

// 공지사항 관련 스키마
export const NoticeQuerySchema = PaginationSchema.extend({
  target: z.string().default('all'),
  status: z.string().default('published')
})

export const NoticeCreateSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다'),
  content: z.string().min(1, '내용은 필수입니다'),
  target_audience: z.enum(['all', 'host', 'customer']).default('all'),
  is_important: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('published')
})

// 인플루언서 공지사항 스키마
export const InfluencerNoticeCreateSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다'),
  content: z.string().min(1, '내용은 필수입니다'),
  notice_type: z.enum(['collaboration', 'announcement', 'update']).default('collaboration'),
  target_month: z.number().optional(),
  target_year: z.number().optional(),
  is_active: z.boolean().default(true)
})

// 문의사항 관련 스키마
export const InquiryQuerySchema = PaginationSchema.extend({
  userType: z.string().default('all'),
  status: z.string().default('all')
})

export const InquiryUpdateSchema = z.object({
  id: z.string().uuid('올바른 ID 형식이 아닙니다'),
  status: z.enum(['pending', 'processing', 'completed']).optional(),
  admin_response: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
})

// 유틸리티 함수
export function parseQuery<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): T {
  const params = Object.fromEntries(searchParams.entries())
  return schema.parse(params)
}

export function parseBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): T {
  return schema.parse(body)
}