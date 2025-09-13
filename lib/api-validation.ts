import { NextResponse } from 'next/server'

export interface ValidationRule {
  field: string
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url'
  minLength?: number
  maxLength?: number
  customMessage?: string
}

export interface ValidationError {
  field: string
  message: string
}

/**
 * API 입력 데이터 검증 유틸리티
 */
export class ApiValidator {
  private errors: ValidationError[] = []

  /**
   * 단일 필드 검증
   */
  validateField(data: any, rule: ValidationRule): boolean {
    const { field, required, type, minLength, maxLength, customMessage } = rule
    const value = data[field]

    // 필수 필드 검증
    if (required && (value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))) {
      this.errors.push({
        field,
        message: customMessage || `${field}은(는) 필수입니다.`
      })
      return false
    }

    // 값이 없고 필수가 아니면 통과
    if (!value && !required) {
      return true
    }

    // 타입 검증
    if (type && value !== undefined && value !== null) {
      switch (type) {
        case 'string':
          if (typeof value !== 'string') {
            this.errors.push({
              field,
              message: customMessage || `${field}은(는) 문자열이어야 합니다.`
            })
            return false
          }
          break
        case 'number':
          if (typeof value !== 'number' && isNaN(Number(value))) {
            this.errors.push({
              field,
              message: customMessage || `${field}은(는) 숫자여야 합니다.`
            })
            return false
          }
          break
        case 'boolean':
          if (typeof value !== 'boolean') {
            this.errors.push({
              field,
              message: customMessage || `${field}은(는) 불린값이어야 합니다.`
            })
            return false
          }
          break
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (typeof value === 'string' && !emailRegex.test(value)) {
            this.errors.push({
              field,
              message: customMessage || `${field}은(는) 유효한 이메일 형식이어야 합니다.`
            })
            return false
          }
          break
        case 'url':
          try {
            new URL(value)
          } catch {
            this.errors.push({
              field,
              message: customMessage || `${field}은(는) 유효한 URL이어야 합니다.`
            })
            return false
          }
          break
      }
    }

    // 문자열 길이 검증
    if (typeof value === 'string') {
      if (minLength && value.trim().length < minLength) {
        this.errors.push({
          field,
          message: customMessage || `${field}은(는) 최소 ${minLength}자 이상이어야 합니다.`
        })
        return false
      }
      if (maxLength && value.trim().length > maxLength) {
        this.errors.push({
          field,
          message: customMessage || `${field}은(는) 최대 ${maxLength}자까지 입력 가능합니다.`
        })
        return false
      }
    }

    return true
  }

  /**
   * 여러 필드 일괄 검증
   */
  validateFields(data: any, rules: ValidationRule[]): boolean {
    this.errors = [] // 에러 초기화
    let isValid = true

    for (const rule of rules) {
      if (!this.validateField(data, rule)) {
        isValid = false
      }
    }

    return isValid
  }

  /**
   * 검증 에러 반환
   */
  getErrors(): ValidationError[] {
    return this.errors
  }

  /**
   * 첫 번째 에러 메시지 반환
   */
  getFirstError(): string {
    return this.errors.length > 0 ? this.errors[0].message : ''
  }

  /**
   * 검증 실패 시 NextResponse 반환
   */
  getErrorResponse(): NextResponse {
    return NextResponse.json({
      ok: false,
      error: this.getFirstError(),
      errors: this.errors
    }, { status: 400 })
  }
}

/**
 * 편의 함수: 단순한 필드 검증
 */
export function validateRequired(data: any, fields: string[]): { isValid: boolean; error?: string } {
  const validator = new ApiValidator()
  const rules: ValidationRule[] = fields.map(field => ({ field, required: true }))

  const isValid = validator.validateFields(data, rules)
  return {
    isValid,
    error: isValid ? undefined : validator.getFirstError()
  }
}

/**
 * 편의 함수: NextResponse 에러 반환
 */
export function createValidationErrorResponse(message: string, errors?: ValidationError[]): NextResponse {
  return NextResponse.json({
    ok: false,
    error: message,
    errors: errors || []
  }, { status: 400 })
}